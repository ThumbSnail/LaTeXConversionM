/*** KaTeX via:  https://github.com/Khan/KaTeX ***/


const txtEntry = document.getElementById('text-entry');
const btnConvert = document.getElementById('convert');
const divOutput = document.getElementById('output');
const latexPreview = document.getElementById('latex');

btnConvert.addEventListener('click', function() {
  latexPreview.innerHTML = '';
  let finalText = convertToDesiredHTML(txtEntry.value);

  divOutput.innerHTML = finalText;
});

function convertToDesiredHTML(str) {
  //could also replace * with \times if that's necessary
  str = str.replace(/\*/g, '\\times');

  //fractions are a bit annoying to work with, so... could search for /, then convert the () before and after into \dfrac{}{}
  let slashIndex = str.indexOf('/');
  let counter = 0;
  while (slashIndex >= 0) {
    let leftParenIndex1 = str.lastIndexOf('(', slashIndex);
    let rightParenIndex1 = str.lastIndexOf(')', slashIndex);
    let leftParenIndex2 = str.indexOf('(', slashIndex);
    let rightParenIndex2 = str.indexOf(')', slashIndex);
    //prevent infinite loop if someone forgets to use ()'s around a fraction:
    if (leftParenIndex1 < 0 || rightParenIndex1 < 0 || leftParenIndex2 < 0 || rightParenIndex2 < 0) {
      str = 'MISSING()forFRACTION /';
      break;
    }
    str = str.substring(0, leftParenIndex1) + '\\dfrac{' + str.substring(leftParenIndex1 + 1, rightParenIndex1) + '}{' + 
          str.substring(leftParenIndex2 + 1, rightParenIndex2) + '}' + str.substring(rightParenIndex2 + 1);

    //extra protection against some unanticipated infinite loop:
    counter++;
    if (counter > 200) {
      break;
    }
    slashIndex = str.indexOf('/');
  }
  counter = 0;

  //do same thing for \sqrt so that you can just type sqrt() like normal?
    //^No, it becomes a mess when there are sqrts in fractions.  Just do \sqrt{} 
  

  //to remove italicizied text, wrap \text{} around any amount of letters that do NOT begin with a \
  //(?<=[\s0-9{(\[]|^) = if preceded by space, digit, {, ( or [  or the start of a line
  //([a-zA-Z]+) = any number of letters
  let regExp = /(?<=[\s0-9{(\[]|^)([a-zA-Z]+)/g;
  str = str.replace(regExp, '\\text{$&}');

  //to convert each line of LaTeX into the appropriate HTML
  let arrayOfLines = str.split(/[\n\r]/g);
  arrayOfLines.forEach(function(string, index) {
      //Also now show a preview of the LaTex:
    latexPreview.innerHTML += katex.renderToString(string) + '<br>';
    arrayOfLines[index] = '&lt;code class="redactor-katex" data-source="' + string + '"&gt;&lt;/code&gt;&lt;br&gt;';
  });


  return arrayOfLines.join('');
}

//load up an example
(function() {
  txtEntry.innerHTML = `a^2 + b^2 = c^2
(2r^2) + (2r^2) = d^2
4r^2 + 4r^2 = d^2
8r^2 = d^2
\\sqrt{8r^2} = \\sqrt{d^2}
r\\sqrt{8} = d
r\\sqrt{4 \\times 2} = d
2r\\sqrt{2} = d
2r\\sqrt{2} \\text{ vs. } \\dfrac{5r}{2}
(5)/(63)
(7x^2 + 20x - 10)/(50x^3 * -5 + \\sqrt{3})
(\\sqrt{49 + x^2 * 2y})/(\\sqrt{13 + y})`;
})();