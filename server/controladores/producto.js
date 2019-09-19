const express = require('express');
const _ = require('underscore');

const { verificaToken } = require('../middlewares/autenticacion');

let app = express();

let Producto = require('../models/producto')

//Obtener todos los productos
app.get('/productos', verificaToken, (req, res) => {

    //parametros opcionales
    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Producto.find({})
        .sort('nombre')
        .populate('usuario', 'nombre email')
        .populate('categoria', 'descripcion')
        .skip(desde)
        .limit(limite)
        .exec((err, productos) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Producto.count((err, conteo) => {
                return res.json({
                    ok: true,
                    productos,
                    cuantos: conteo
                });
            });

        });

});

//Mostrar un producto por id
app.get('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Producto.findById(id).populate('usuario', 'nombre email').populate('categoria', 'descripcion').exec((err, productoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        return res.json({
            ok: true,
            producto: productoDB
        });

    });
});

//Buscar productos 
app.get('/productos/buscar/:termino', verificaToken, (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    Producto.find({nombre: regex}).populate('usuario', 'nombre email').populate('categoria', 'descripcion').exec((err, productos) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        return res.json({
            ok: true,
            productos
        });

    });
});

//Crear nuevo producto
app.post('/productos', verificaToken, (req, res) => {

    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        categoria: body.categoria,
        disponible: body.disponible,
        usuario: req.usuario._id
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        return res.status(201).json({
            ok: true,
            producto: productoDB
        });
    });

});

//Actualizar un producto por id
app.put('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    //Para decir cuales tener en cuenta para la actualización
    let body = _.pick(req.body, ['nombre', 'precioUni', 'descripcion', 'categoria']);

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: 'No existe ningun producto con el ID'
            });
        }

        return res.json({
            ok: true,
            producto: productoDB
        });
    });
});

//Borra un producto por id
app.delete('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    let cambiaDisponibilidad = {disponible: false};

    Producto.findByIdAndUpdate(id, cambiaDisponibilidad, { new: true}, (err, productoBorrado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        return res.json({
            ok: true,
            producto: productoBorrado,
            message: 'Producto borrado'
        });
    });

});


module.exports = app;