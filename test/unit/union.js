var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('union test',function(){
  it('basic test', function(){
    var sql, ast;
    sql = 'select 1 union select true';
    ast = Parser.parse(sql);

    ast.should.eql({ 
      type: 'select',
      distinct: null,
      columns: [ 
        { expr: { type: 'number', value: 1 }, as: null }
      ],
      from: null,
      where: null,
      groupby: null,
      orderby: null,
      limit: null,
      _next: { 
        type: 'select',
        distinct: null,
        columns: [ 
          { expr: { type: 'bool', value: true }, as: null }
        ],
        from: null,
        where: null,
        groupby: null,
        orderby: null,
        limit: null
      } 
    });
  })
  
});

