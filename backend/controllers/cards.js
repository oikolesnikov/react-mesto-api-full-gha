const Cards = require('../models/card');
const BadRequest = require('../errors/BadRequest');
const NotFound = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

const getCards = (req, res, next) => {
  Cards.find({})
    .then((cards) => res.status(200).send(cards))
    .catch(next);
};

const createCard = (req, res, next) => {
  const { name, link } = req.body; 
  const owner = req.user; 
  Card.create({ name, link, owner }) 
    .then((card) => res.send(card)) 
    .catch((err) => { 
      if (err.name === 'ValidationError') { 
        return next(new BadRequestError('Переданы некорректные данные при создании карточки.')); 
      } else { 
        return next(err); 
      } 
    }); 
}; 

const deleteCard = (req, res, next) => { 
  const { cardId } = req.params; 
  const owner = req.user._id; 
 
  Card.findById(cardId) 
    .then((card) => { 
      if (!card) { 
        throw new NotFound('Такой карточки не существует'); 
      } 
      if (card.owner._id.toString() !== owner) { 
        throw new ForbiddenError('В доступе отказано'); 
      } 
 
      return Card.findByIdAndRemove(cardId) 
        .populate(['owner', 'likes']) 
        .then(() => res.send({ message: 'Карточка успешно удалена' })) 
        .catch(next); 
    }) 
    .catch(next); 
}; 

const likeCard = (req, res, next) => {
  const { cardId } = req.params; 
  const owner = req.user._id; 
  Card.findByIdAndUpdate( 
    cardId, 
    { $addToSet: { likes: owner } }, 
    { new: true }, 
  ) 
    .populate(['owner', 'likes']) 
    .then((card) => { 
      if (!card) throw new NotFound('Такой карточки не существует'); 
      res.send(card); 
    }) 
    .catch(next); 
}; 

const dislikeCard = (req, res, next) => {
  const { cardId } = req.params; 
  const owner = req.user._id; 
  Card.findByIdAndUpdate( 
    cardId, 
    { $pull: { likes: owner } }, 
    { 
      new: true
    }, 
  ) 
    .then((card) => { 
      if (!card) throw new NotFound('Такой карточки не существует'); 
      res.send(card); 
    }) 
    .catch(next); 
}; 

module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};




