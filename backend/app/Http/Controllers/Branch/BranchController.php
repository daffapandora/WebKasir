<?php

namespace App\Http\Controllers\Branch;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }
}
