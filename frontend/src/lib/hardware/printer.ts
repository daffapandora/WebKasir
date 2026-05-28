// ============================================
// KasirPro — Thermal Printer (ESC/POS)
// WebUSB + Web Bluetooth printer integration
// ============================================

import type { OfflineTransaction, PrinterConfig } from '../types';

export class ThermalPrinter {
  private usbDevice: USBDevice | null = null;
  private btCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private config: PrinterConfig;
  private connected = false;

  constructor(config: PrinterConfig = { type: 'usb', paperWidth: 58, characterSet: 'pc437' }) {
    this.config = config;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  /** Connect via WebUSB */
  async connectUSB(): Promise<boolean> {
    try {
      if (!('usb' in navigator)) {
        console.warn('WebUSB not supported');
        return false;
      }

      this.usbDevice = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x0416 }, // Winbond
          { vendorId: 0x0483 }, // STMicroelectronics
          { vendorId: 0x04B8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
          { vendorId: 0x1FC9 }, // NXP (common in cheap thermal printers)
          { vendorId: 0x0FE6 }, // ICS
          { vendorId: 0x1A86 }, // QinHeng (CH340 USB-Serial)
        ],
      });

      await this.usbDevice.open();
      if (this.usbDevice.configuration === null) {
        await this.usbDevice.selectConfiguration(1);
      }
      await this.usbDevice.claimInterface(0);
      this.config.type = 'usb';
      this.connected = true;
      return true;
    } catch (err) {
      console.error('USB Printer connection failed:', err);
      return false;
    }
  }

  /** Connect via Web Bluetooth */
  async connectBluetooth(): Promise<boolean> {
    try {
      if (!('bluetooth' in navigator)) {
        console.warn('Web Bluetooth not supported');
        return false;
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      this.btCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      this.config.type = 'bluetooth';
      this.connected = true;
      return true;
    } catch (err) {
      console.error('Bluetooth Printer connection failed:', err);
      return false;
    }
  }

  /** Get column width based on paper width */
  private get columns(): number {
    return this.config.paperWidth === 80 ? 48 : 32;
  }

  /** Format currency (Rupiah) */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID').format(amount);
  }

  /** Format date/time */
  private formatDateTime(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Pad line to fill columns */
  private padLine(left: string, right: string): string {
    const space = this.columns - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  }

  /** Build ESC/POS receipt data */
  generateReceipt(tx: OfflineTransaction): Uint8Array {
    const enc = new TextEncoder();
    const cmds: number[] = [];

    // Initialize
    cmds.push(0x1B, 0x40); // ESC @ — reset

    // Center align
    cmds.push(0x1B, 0x61, 0x01);

    // Store name (bold + double height)
    cmds.push(0x1B, 0x45, 0x01); // Bold ON
    cmds.push(0x1D, 0x21, 0x11); // Double width+height
    cmds.push(...enc.encode(tx.outletName + '\n'));
    cmds.push(0x1D, 0x21, 0x00); // Normal size
    cmds.push(0x1B, 0x45, 0x00); // Bold OFF

    // Address + phone
    cmds.push(...enc.encode(tx.outletAddress + '\n'));
    cmds.push(...enc.encode(tx.outletPhone + '\n'));

    // Divider
    cmds.push(...enc.encode('='.repeat(this.columns) + '\n'));

    // Left align
    cmds.push(0x1B, 0x61, 0x00);

    // Invoice info
    cmds.push(...enc.encode(`No  : ${tx.invoiceNumber}\n`));
    cmds.push(...enc.encode(`Tgl : ${this.formatDateTime(tx.createdAt)}\n`));
    cmds.push(...enc.encode(`Kasir: ${tx.cashierName}\n`));

    // Divider
    cmds.push(...enc.encode('-'.repeat(this.columns) + '\n'));

    // Items
    for (const item of tx.items) {
      cmds.push(...enc.encode(`${item.productName}\n`));
      if (item.variantName && item.variantName !== 'Default') {
        cmds.push(...enc.encode(`  (${item.variantName})\n`));
      }
      const qty = `  ${item.quantity} x ${this.formatCurrency(item.unitPrice)}`;
      const sub = this.formatCurrency(item.subtotal);
      cmds.push(...enc.encode(this.padLine(qty, sub) + '\n'));
    }

    // Divider
    cmds.push(...enc.encode('-'.repeat(this.columns) + '\n'));

    // Subtotal
    cmds.push(...enc.encode(this.padLine('Subtotal', this.formatCurrency(tx.subtotal)) + '\n'));

    if (tx.discountAmount > 0) {
      cmds.push(...enc.encode(this.padLine('Diskon', '-' + this.formatCurrency(tx.discountAmount)) + '\n'));
    }

    if (tx.taxAmount > 0) {
      cmds.push(...enc.encode(this.padLine('PPN 11%', this.formatCurrency(tx.taxAmount)) + '\n'));
    }

    // Total (bold + bigger)
    cmds.push(0x1B, 0x45, 0x01); // Bold
    cmds.push(0x1D, 0x21, 0x01); // Double height
    cmds.push(...enc.encode(this.padLine('TOTAL', 'Rp ' + this.formatCurrency(tx.totalAmount)) + '\n'));
    cmds.push(0x1D, 0x21, 0x00); // Normal
    cmds.push(0x1B, 0x45, 0x00);

    // Divider
    cmds.push(...enc.encode('-'.repeat(this.columns) + '\n'));

    // Payment
    const method = tx.payments[0]?.method?.toUpperCase() || 'CASH';
    cmds.push(...enc.encode(this.padLine(`Bayar (${method})`, 'Rp ' + this.formatCurrency(tx.amountPaid)) + '\n'));
    if (tx.changeAmount > 0) {
      cmds.push(...enc.encode(this.padLine('Kembali', 'Rp ' + this.formatCurrency(tx.changeAmount)) + '\n'));
    }

    // Footer
    cmds.push(...enc.encode('\n'));
    cmds.push(0x1B, 0x61, 0x01); // Center
    cmds.push(...enc.encode('Terima kasih atas kunjungan Anda!\n'));
    cmds.push(...enc.encode('Barang yang sudah dibeli\n'));
    cmds.push(...enc.encode('tidak dapat ditukar/dikembalikan\n'));
    cmds.push(...enc.encode('\n'));
    cmds.push(...enc.encode('--- Powered by KasirPro ---\n'));
    cmds.push(...enc.encode('\n\n\n'));

    // Cut paper (partial cut)
    cmds.push(0x1D, 0x56, 0x01);

    // Open cash drawer
    cmds.push(0x1B, 0x70, 0x00, 0x19, 0xFA);

    return new Uint8Array(cmds);
  }

  /** Send raw data to printer */
  async send(data: Uint8Array): Promise<void> {
    if (!this.connected) throw new Error('Printer not connected');

    if (this.config.type === 'usb' && this.usbDevice) {
      const endpoint = this.usbDevice.configuration!
        .interfaces[0].alternate.endpoints
        .find(e => e.direction === 'out');
      if (!endpoint) throw new Error('No output endpoint found');

      // Send in chunks of 64 bytes (USB packet size)
      const chunkSize = 64;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.usbDevice.transferOut(endpoint.endpointNumber, chunk);
      }
    } else if (this.config.type === 'bluetooth' && this.btCharacteristic) {
      // Bluetooth has smaller MTU, send in 20-byte chunks
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.btCharacteristic.writeValue(chunk);
        await new Promise(r => setTimeout(r, 50)); // Small delay for BT
      }
    }
  }

  /** Print receipt */
  async printReceipt(transaction: OfflineTransaction): Promise<void> {
    const data = this.generateReceipt(transaction);
    await this.send(data);
  }

  /** Open cash drawer (standalone) */
  async openDrawer(): Promise<void> {
    const cmd = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    await this.send(cmd);
  }

  /** Disconnect */
  async disconnect(): Promise<void> {
    if (this.usbDevice) {
      await this.usbDevice.close();
      this.usbDevice = null;
    }
    this.btCharacteristic = null;
    this.connected = false;
  }
}

// Singleton printer instance
let printerInstance: ThermalPrinter | null = null;

export function getPrinter(): ThermalPrinter {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter();
  }
  return printerInstance;
}
