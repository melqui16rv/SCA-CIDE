PHP

<?php

use Illuminate\Support\Facades\Route;

// Esta ruta hará que al entrar a la raíz de tu servidor local cargue tu formulario
Route::get('/', function () {
    return view('SCA-FORMULARIO.iindex');
});