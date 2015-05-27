var should = require('should');
var doOrderby = require('../../base/orderby');

var AstReader = require('../../lib/ast_helper').Reader;

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('orderby  test', function(){

  it('basic test', function() {
    var rawData = { 
      columns: [[{table : null, column : 'id'}], [{table : null, column : 'sex'}]],
      data: [ 
        [ 3, 'a' ], 
        [ 4, 'f' ], 
        [ 4, 'b' ], 
        [ 8, 'f' ], 
        [ 10, 'c' ] 
      ] 
    };
    var ast = {
      orderby : [
        {
          expr : {
            type: 'column_ref', 
            table : null,
            column : 'sex'
          },
          type : 'ASC'
        },
        {
          expr : {
            type: 'column_ref', 
            table : null,
            column : 'id'
          },
          type : 'DESC'
        }
      ]  
    };
    var sp = new AstReader(ast);
    var ed = doOrderby(rawData, [
      {name : {table : null, column : 'sex'}, type : 'ASC'},
      {name : {table : null, column : 'id'},  type : 'DESC'}
    ]);
    //inspect(ed);
    ed.data.should.eql([ 
      [ 3, 'a' ], 
      [ 4, 'b' ], 
      [ 10, 'c' ], 
      [ 8, 'f' ], 
      [ 4, 'f' ] 
    ]);
  });

});
