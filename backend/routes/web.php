<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['status' => 'TokoPOS API is active'];
});
