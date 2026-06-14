<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Http\Controllers\Inventory\HppController;

Schedule::call(function () {
    app(HppController::class)->recalculateAll();
})->daily()->name('recalculate-hpp');

