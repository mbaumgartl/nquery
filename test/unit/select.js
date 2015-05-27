var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('select test',function(){
  
  it('clauses test', function() {
    var sql, ast;

    sql = "SELECT a";
    ast = Parser.parse(sql);

    ast.columns.length.should.eql(1);
    should(ast.distinct).eql(null);
    should(ast.where).eql(null);
    should(ast.from).eql(null);
    should(ast.groupby).eql(null);
    should(ast.orderby).eql(null);
    should(ast.limit).eql(null);


    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.distinct.should.eql('DISTINCT');
    should(ast.from).not.eql(null);
    ast.where.should.not.eql(null);
    ast.groupby.should.not.eql(null);
    ast.orderby.should.not.eql(null);
    ast.limit.should.not.eql(null);
  });   

  it('limit test', function() {
    var sql, ast;

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 0, 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);
  });   

  it('group by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 GROUP BY d, t.b, t.c";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.groupby.should.eql([
      { type: 'column_ref', table: null, column: 'd' },
      { type: 'column_ref', table: 't', column: 'b' },
      { type: 'column_ref', table: 't', column: 'c' }
    ]);
  });   
  
  it('order by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 order BY d, t.b dEsc, t.c, SuM(e)";
    ast = Parser.parse(sql);

    inspect(ast.orderby);
    ast.orderby.should.eql([
      { expr: { type: 'column_ref', table: null, column: 'd' },  type: 'ASC' },
      { expr: { type: 'column_ref', table: 't', column: 'b' }, type: 'DESC' },
      { expr: { type: 'column_ref', table: 't', column: 'c' }, type: 'ASC' },
      {   
        expr: { 
            type: 'aggr_func',   
            name: 'SUM', 
            args: {
              expr: { type: 'column_ref', table: null, column: 'e' }
            }
        },
        type: 'ASC'
      }
    ]);
  });   

  it('column clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t";
    ast = Parser.parse(sql);
    ast.columns.should.eql('*');

    sql = "SELECT a aa, b.c as bc, fun(d), 1+3 FROM  t";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.columns.should.eql([
      { expr: { type: 'column_ref', table: null, column: 'a' }, as: 'aa' },
      { expr: { type: 'column_ref', table: 'b', column: 'c' },  as: 'bc' },
      { 
        expr: { 
          type: 'function', 
          name: 'fun', 
          args: {
            type  : 'expr_list',  
            value : [ { type: 'column_ref', table: null, column: 'd' } ]
          }
        },
        as: null
      },
      { 
        expr: { 
          type: 'binary_expr', 
          operator: '+',
          left: {
            type  : 'number',
            value : 1 
          },
          right: {
            type  : 'number',
            value : 3
          }
        },
        as: null
      } 
    ]);
   
  });   

  it('where clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t where t.a > 0 AND t.c between 1 and 't' AND Not true";
    ast = Parser.parse(sql);

    //inspect(ast.where);
    ast.where.should.eql({
      type: 'binary_expr',
      operator: 'AND',
      left: { 
        type: 'binary_expr',
        operator: 'AND',
        left: { 
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'a' 
          },
          right: { 
            type: 'number', value: 0
          } 
        },
        right: { 
          type: 'binary_expr',
          operator: 'BETWEEN',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'c' 
          },
          right: { 
            type : 'expr_list',
            value : [
              { type: 'number', value: 1 },
              { type: 'string', value: 't' } 
            ]
          } 
        } 
      },
      right: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr: { 
          type: 'bool', value: true } 
        } 
      });

  });   

  it('from clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t, a.b b, c.d as cd";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([ 
      { db: null, table: 't', as: null },
      { db: 'a', table: 'b', as: 'b' },
      { db: 'c', table: 'd', as: 'cd' } 
    ]);


    sql = "SELECT * FROM t join a.b b on t.a = b.c left join d on d.d = d.a";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([ 
      { db: null, table: 't', as: null },
      { 
        db: 'a',
        table: 'b',
        as: 'b',
        join: 'INNER JOIN',
        on: { 
          type: 'binary_expr',
          operator: '=',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'a'
          },
          right: { 
            type: 'column_ref',
            table: 'b',
            column: 'c' 
          }
        } 
      },
      { 
        db: null,
        table: 'd',
        as: null,
        join: 'LEFT JOIN',
        on: { 
          type: 'binary_expr',
          operator: '=',
          left: { 
            type: 'column_ref',
            table: 'd',
            column: 'd'
          },
          right: { 
            type: 'column_ref',
            table: 'd',
            column: 'a' 
          }
        }
      }
    ]);
  });

  describe('MySQL SQL extensions', function () {
    var sql, ast;

    it('should support SQL_CALC_FOUND_ROWS', function () {
      sql = 'SELECT SQL_CALC_FOUND_ROWS col FROM t';
      ast = Parser.parse(sql);
      ast.options.should.be.instanceof(Array);
      ast.columns.should.eql([
        { expr: { type: 'column_ref', table: null, column: 'col' }, as: null }
      ]);
      ast.options.should.containEql('SQL_CALC_FOUND_ROWS');
    });

    it('should support SQL_CACHE/SQL_NO_CACHE', function () {
      ast = Parser.parse('SELECT SQL_CACHE col FROM t');
      ast.options.should.containEql('SQL_CACHE');

      ast = Parser.parse('SELECT SQL_NO_CACHE col FROM t');
      ast.options.should.containEql('SQL_NO_CACHE');
    });

    it('should support SQL_SMALL_RESULT/SQL_BIG_RESULT', function () {
      ast = Parser.parse('SELECT SQL_SMALL_RESULT col FROM t');
      ast.options.should.containEql('SQL_SMALL_RESULT');

      ast = Parser.parse('SELECT SQL_BIG_RESULT col FROM t');
      ast.options.should.containEql('SQL_BIG_RESULT');
    });

    it('should support SQL_BUFFER_RESULT', function () {
      sql = 'SELECT SQL_BUFFER_RESULT col FROM t';
      ast = Parser.parse(sql);
      ast.options.should.containEql('SQL_BUFFER_RESULT');
    });

    it('should support multiple options per query', function () {
      sql = 'SELECT SQL_CALC_FOUND_ROWS SQL_BIG_RESULT SQL_BUFFER_RESULT col FROM t';
      ast = Parser.parse(sql);
      ast.options.should.have.length(3);
      ast.options.should.containEql('SQL_CALC_FOUND_ROWS');
      ast.options.should.containEql('SQL_BIG_RESULT');
      ast.options.should.containEql('SQL_BUFFER_RESULT');
    });
  });

  xit('from clause test', function() {
    var sql, ast;

    sql = "select i_item_id, i_list_price, avg(ss_sales_price) agg1 FROM store_sales JOIN item on (store_sales.ss_item_id = item.i_item_id) JOIN customer on (store_sales.ss_customer_id = customer.c_id)";
    ast = Parser.parse(sql);

    //inspect(ast);
    //ast.from.should.eql([});   
  });

  xit('keyword as table test', function() {
    var sql, ast;
    sql = 'select * from service_a.table as sa inner join service_b.table as sb on sa.id=sb.id where sa.fm=f and sb.id=3';

    ast = Parser.parse(sql);
    //inspect(ast);
    //ast.from.should.eql([});   
  });

});

