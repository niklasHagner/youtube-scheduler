//Create a handlebar-express object

function hbsHelpers(hbs) {
  return hbs.create({
    helpers: { 
      json: function(value, options) {
        return JSON.stringify(value);
      }
    }

  });
}

module.exports = hbsHelpers;