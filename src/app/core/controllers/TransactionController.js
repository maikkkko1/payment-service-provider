/**
 * @author Maikon Ferreira
 * @email mai.kon96@hotmail.com
 * @create date 2019-12-27 20:59:32
 * @modify date 2019-12-27 20:59:32
 * @desc Transactions operations.
 */

const Util = require('../Util');
const Request = require('../Request');
const { Transaction } = require('../../models');
const PayablesController = require('./PayablesController');

exports.createPayment = async (req, res) => {
  const body = req.body;

  if (!Util.isValid(body) || !Util.isValidObject(body) || !validateBody(body)) {
    res.send(Request.response('Invalid body', true)); return;
  }

  const cardObject = getCardObject(req.body.cardData);

  if (!cardObject) {
    res.send(Request.response('Invalid card data', true)); return;
  }

  const transactionObject = await createTransaction(body, cardObject);

  if (!transactionObject) {
    res.send(Request.response('Fail while creating transaction or payable', true)); return;
  }

  res.send(Request.response(transactionObject));
};

/**
 * Create the transaction and his payables.
 * @param {object} data 
 * @param {object} cardObject 
 */
async function createTransaction(data, cardObject) {
  const transactionObject = data;

  transactionObject.cardData = JSON.stringify(cardObject);

  try {
    const transaction = await Transaction.create(transactionObject);

    transactionObject.transactionId = transaction.dataValues.id;
  } catch(err) {
    console.log(err);

    return false;
  }

  const payable = await PayablesController.createPayable(transactionObject);

  if (!payable) return false;

  transactionObject.payable = payable;

  return transactionObject;
}

function validateBody(body) {
  const validateKeys = ['clientId', 'value', 'description', 'paymentMethod', 'cardData', 'installments'];

  for (const key of validateKeys) {
    if (!Util.isValid(body[key])) return false;
  }

  return true;
}

function getCardObject(data) {
  const cardKeys = Object.keys(data);

  if (cardKeys.length < 4) return false;

  if (!data.cardNumber) return false;

  const prefix = '**** **** **** ';

  data.cardNumber = prefix + data.cardNumber.substring(data.cardNumber.length - 4);
  
  return data;
}