var renderData = [];//全局变量
function renderTemplate( target_id , writeData , index){
  renderData[index] = writeData;
  var template_string = renderData[index];
  var compileText = template_string;//获取要编译模板字符串
  console.log(compileText)

  var compile = jade.compile( compileText , { layout : true } );//编译需要渲染的元素
  var outputText = compile( renderData );
  $( target_id ).empty();//清空要渲染的元素
  $( target_id ).append( outputText );//渲染到元素上
};