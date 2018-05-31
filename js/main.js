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

//autoselect text when click on output div
divOutput.addEventListener('focus', function() {
  let range = document.createRange();
  range.selectNodeContents(divOutput);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
})

function convertBasicFractionToLatex(str) {
  //for simple single-term fractions NOT enclosed with parentheses
  let numeratorRegExp = /[a-zA-Z0-9%\.\^\\}{]+\s*\//g;

  str = str.replace(numeratorRegExp, '\\dfrac{$&');

  let denominatorRegExp = /\/\s*[a-zA-Z0-9%\.\^\\}{]+/g;

  str = str.replace(denominatorRegExp, '/$&}');

  //should be of the from \dfrac{stuff // stuff2}, so replace the two slashes with }{:
  str = str.replace(/\s*\/\/\s*/g, '}{');

  return str;
}

function convertComplicatedFractionToLatex(str) {
  //for simple single-term fractions NOT enclosed with parentheses
  let numeratorRegExp = /\(*.+\)*\s*\//g; //keep the opening parens in the match
  //str = str.replace(numeratorRegExp, '\\dfrac{$&');  //don't include the opening parens in the match

  //let numeratorRegExp = /(?<=\(*).+\)*\s*\//g;  //does not keep the opening left (
  //str = str.replace(numeratorRegExp, '\\dfrac{$&');

  str = str.replace(numeratorRegExp, function(match='$&') {
    return '\\dfrac{' + match.replace(/^\(*/, '');  //get rid of the opening parentheses so that they're not displayed
  });

  let denominatorRegExp = /\/\s*\(*.+\)*/g;  //include the last parens
  //let denominatorRegExp = /\/\s*\(*.+(?=\)*)/g;  //don't include the last paren in the match

  //str = str.replace(denominatorRegExp, '/$&}');

  str = str.replace(denominatorRegExp, function(match='$&') {
    return '/' + match.replace(/\)*$/, '') + '}';   //get rid of closing parens in the string
  });

  //should be of the from \dfrac{stuff // stuff2}, so replace the two slashes with }{:
  //str = str.replace(/\s*\/\/\s*/g, '}{');
  str = str.replace(/\)*\s*\/\/\s*\(*/g, '}{');

  return str;
}

function convertParenFractionToLatex(str) {
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

  return str;
}

//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function getRidOfItalics(string) {
  let arrayOfLines = string.split(/[\n\r]/g);
  const regExp = /[a-zA-Z]/;
  const notALetterRegExp = /[^a-zA-Z\.]/;

  arrayOfLines.forEach(function(str, index) {
    //protection against infinite loop:
    let counter = 0;
    //find a letter
    let letterIndex = str.regexIndexOf(regExp, 0);
    let posInString = letterIndex;
    while (letterIndex >= 0) {

      //if not preceded by \  (ie, if not a LaTeX keyword)
      if (letterIndex == 0 || str.charAt(letterIndex - 1) != '\\') {
        let indexStartWord = letterIndex;  //where to place \text{

        str = str.substring(0, indexStartWord) + '\\text{' + str.substring(indexStartWord);
        posInString += 7;  //move the position up the length of the newly added '\text{' plus the letter you found

        //find end of word to add a brace:
        let indexEndWord = str.regexIndexOf(notALetterRegExp, posInString);
        if (indexEndWord < 0) {
          str = str.substring(0) + '}';
        }
        else {
          str = str.substring(0, indexEndWord) + '}' + str.substring(indexEndWord);
        }
        posInString = indexEndWord;

        arrayOfLines[index] = str;
      }
      else { //jump to end of latex keyword to resume search (ie, find the next { or space for keywords like \times)
        //if that keyword is \text, then jump to the CLOSING bracket:
        if (str.substring(posInString, posInString + 4) == 'text') {
          posInString = str.regexIndexOf(/[\}]/, posInString);
        }
        else {
          posInString = str.regexIndexOf(/[\{\s]/, posInString);
        }
      }

      //resume search for next potential letter:
      if (posInString >= str.length || posInString == -1) {
        letterIndex = -1;
      }
      else {
        letterIndex = str.regexIndexOf(regExp, posInString);
      }
      posInString = letterIndex;

      //just in case something unanticipated happens, kill the loop if it's run too much
      counter++;
      if (counter > 100) {
        console.log('You were stuck in infinite loop...');
        break;
      }
    }
  });

  return arrayOfLines.join('\n');
}

function convertToDesiredHTML(str) {
  //replace * with multiplication symbol:
  str = str.replace(/\*/g, '\\times');
  //replace % with the format LaTeX needs:
  str = str.replace(/%/g, '\\%');
  //replace pi with the format LaTeX needs:
  str = str.replace(/pi/g, '\\pi');


  //replace simple, one-term fractions via regexp:
  str = convertBasicFractionToLatex(str);

  //this one doesn't quite work how I'd want it to; introduces new complications
  //str = convertComplicatedFractionToLatex(str);

  //fractions are a bit annoying to work with, so... could search for /, then convert the () before and after into \dfrac{}{}
  str = convertParenFractionToLatex(str);
  //^Could I replace this with a slightly altered version of my new basic regExp one?  Might be better.
  //**Would certainly get rid of the infinite loop possibilities

  //do same thing for \sqrt so that you can just type sqrt() like normal?
    //^No, it becomes a mess when there are sqrts in fractions.  Just do \sqrt{} 
  

  //to remove italicizied text, wrap \text{} around any amount of letters that do NOT begin with a \
  //(?<=[\s0-9{(\[]|^) = if preceded by space, digit, {, ( or [  or the start of a line
  //([a-zA-Z]+) = any number of letters
  //let regExp = /(?<=[\s0-9{(\[]|^)([a-zA-Z]+)/g;
  //str = str.replace(regExp, '\\text{$&}');

  //^That doesn't quite work as desired.  New idea:
  //Find a letter
  //As long as that letter is NOT preceeded by a \, it's a possible word not used as a LaTeX keyword
    //^If it IS, then jump ahead until you find a {; anything beyond that has the potential to be a letter
  //Thus, stick \text{ in front of it
  //then travel until you find a NON-letter (digit/brace/symbol [EXCEPT a period]); place a } before it
  str = getRidOfItalics(str);

  //for me, I like a little more space around "vs.".  Thus, replace \text{vs.} with \text{ vs. }
  str = str.replace(/vs\./g, ' vs. ');

  //to convert each line of LaTeX into the appropriate HTML
  let arrayOfLines = str.split(/[\n\r]/g);
  arrayOfLines.forEach(function(string, index) {
    if (string === '') {
      //then it's just a blank line:
      latexPreview.innerHTML += '<br>';
      arrayOfLines[index] = '&lt;br&gt;';
    }
    else {
      //show a preview of the displayed LaTeX and make the final HTML
      latexPreview.innerHTML += katex.renderToString(string) + '<br>';

      //if more than one line, add a break:
      if (arrayOfLines.length > 1) {
        arrayOfLines[index] = '&lt;code class="redactor-katex" data-source="' + string + '"&gt;&lt;/code&gt;&lt;br&gt;';
      }
      else {
        arrayOfLines[index] = '&lt;code class="redactor-katex" data-source="' + string + '"&gt;&lt;/code&gt;';
      }
    }
  });


  return arrayOfLines.join('');
}

//load up an example
(function() {
  txtEntry.innerHTML = `\\text{UPDATED: Fraction entry easier, see notes}
3/4 = (x)/(pi + x^2)
(x^2 + \\sqrt{y^2 - 8} + 2/5) / (distance * time)

(\\sqrt{49 + x^2 * 2y/x})/(\\sqrt{13 + y + 140%})

multi word variable = pi
\\text{multi word variable} = pi`
})();