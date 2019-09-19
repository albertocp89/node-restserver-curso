const express = require('express');

const { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

let app = express();

let Categoria = require('../models/categoria')

//Obtener todas las categorías
app.get('/categoria', verificaToken, (req, res) => {

    //parametros opcionales
    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Categoria.find({})
    .sort('descripcion')
        .populate('usuario','nombre email')
        .skip(desde)
        .limit(limite)
        .exec((err, categorias) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Categoria.count((err, conteo) => {
                return res.json({
                    ok: true,
                    categorias,
                    cuantos: conteo
                });
            });

        });

});

//Mostrar una categoría por id
app.get('/categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Categoria.findById(id).populate('usuario', 'nombre email').exec((err, categoriaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err: 'No existe ninguna categoria con dicho ID'
            });
        }

        return res.json({
            ok: true,
            categoria: categoriaDB
        });

    });
});

//Crear nueva categoría
app.post('/categoria', verificaToken, (req, res) => {

    let body = req.body;

    let categoria = new Categoria({
        descripcion: body.descripcion,
        usuario: req.usuario._id
    });

    categoria.save((err, categoriaDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });

});

//Actualizar una categoría por id
app.put('/categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;
    //Para decir cuales tener en cuenta para la actualización
    let categoriaModificada = {
        descripcion: body.descripcion
    };

    Categoria.findByIdAndUpdate(id, categoriaModificada, { new: true, runValidators: true }, (err, categoriaDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err: 'No existe ninguna categoría con el ID'
            });
        }

        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

//Borra una categoría por id
app.delete('/categoria/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    let id = req.params.id;
    Categoria.findByIdAndRemove(id, (err, categoriaBorrada) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!categoriaBorrada) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Categoría no encontrada'
                }
            });
        }

        return res.json({
            ok: true,
            categoria: categoriaBorrada
        });
    });

});


module.exports = app;