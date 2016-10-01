//Create a handlebar-express object

function hbsHelpers(hbs) {
  return hbs.create({
    helpers: { 
      json: function(value, options) {
        return JSON.stringify(value);
      },
      eq: function(item1, item2, operator) {
        if (operator === "eq") return item1 === item2;
      }
    }

  });
}

module.exports = hbsHelpers;