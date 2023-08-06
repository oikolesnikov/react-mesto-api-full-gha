const { JWT_SECRET, NODE_ENV } = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFound = require('../errors/NotFoundError');
const BadRequest = require('../errors/BadRequest');
const ConflictError = require('../errors/ConflictError');

const getUsers = (req, res, next) => {
  const { userList } = {};
  return User.find(userList)
    .then((users) => res.status(200).send(users))
    .catch(next);
};

const getUser = (req, res, next) => {
  const { userId } = req.params;
  userSchema.findById(userId)
    .orFail(new Error('NotValidId'))
    .then((user) => {
      res.status(200).send({ user });
    })
    .catch((err) => {
      if (err.message === 'NotValidId') {
        return next(new NotFound('Пользователь по указанному _id не найден.'));
      } else if (err.name === 'CastError') {
        return next(new BadRequest('Пользователь по указанному _id не найден.'));
      } else {
        return next(err);
      }
    });
};

const createUser = (req, res, next) => {
  const { 
    name, about, avatar, email, password, 
  } = req.body; 
  bcrypt.hash(password, SALT_ROUNDS) 
    .then((hash) => User.create({ 
      name, about, avatar, email, password: hash, 
    })) 
    .then((user) => res.send(user)) 
    .catch((err) => { 
      if (err.code === 11000) { 
        return next(new ConflictError('Пользователь с данным email уже был зарегестрирован.')); 
      } else if (err.name === 'ValidationError') { 
        return next(new BadRequest('Переданы некорректные данные при создании пользователя.')); 
      } else { 
        return next(err); 
      } 
    }) 
    .catch(next); 
}; 

const getCurrentUser = (req, res, next) => User.findById(req.user._id)
  .orFail(() => {
    throw new NotFound('Пользователь не найден');
  })
  .then((user) => res.status(200).send({ user }))
  .catch((err) => {
    if (err.name === 'CastError') {
      throw new BadRequest('Переданы некорректные данные');
    } else if (err.name === 'NotFound') {
      throw new NotFound('Пользователь не найден');
    } else {
      next(err);
    }
  })
  .catch(next);

const updateUser = (req, res, next) => {
  const { name, about } = req.body;

  return User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    { new: true },
  ).orFail(() => {
    throw new NotFound('Пользователь с указанным _id не найден');
  })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError' || err.name === 'CastError') {
        throw new BadRequest('Переданы некорректные данные при обновлении профиля');
      } else {
        next(err);
      }
    })
    .catch(next);
};

const updateAvatar = (req, res, next) => {
  const { avatar } = req.body; 
  User.findByIdAndUpdate( 
    req.user._id, 
    { avatar }, 
    { 
      new: true, 
      runValidators: true, 
    }, 
  ) 
    .then((user) => { 
      if (!user) throw new NotFound('Пользователь с таким ID не найден'); 
      return res.send(user); 
    }) 
    .catch(next); 
}; 

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, `${NODE_ENV === 'production' ? JWT_SECRET : 'yandex-praktikum'}`, { expiresIn: '7d' });
      res.send({ token });
    })
    .catch(next);
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateAvatar,
  getCurrentUser,
  login,
};
