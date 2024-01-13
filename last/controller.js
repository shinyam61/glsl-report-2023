const controller = () => {

  const cRoot = document.getElementById('controller');

  if (!cRoot) {
    controller.isTest = false;
    return;
  }
  controller.isTest = true;
  
  const xCol = document.getElementById('vcol');
  const yCol = document.getElementById('hcol');
  
  const table = document.getElementById('table');
  
  const cellTemplate = cRoot.querySelector('.cell').cloneNode(true);
  
  const cloneCell = ({x, y}) => {
    const cell = cellTemplate.cloneNode(true);
    const cellF = cell.querySelector('input');
    cellF.id = `x${x}y${y}`
    return cell;
  }
  const createRaw = () => {
    const row = document.createElement('div')
    row.classList.add('row')
    return row;
  }
  
  xCol.addEventListener('change', () => {
    [...table.children].forEach((row, rowIdx) => {
      const cellCount = row.childElementCount;
      if (xCol.value > cellCount) {
        const xNum = xCol.value;
        row.appendChild(cloneCell({
          x: xNum,
          y: rowIdx
        }))
      } else {
        row.lastElementChild.remove();
      }
    })
  })
  yCol.addEventListener('change', () => {
    const rowCount = table.childElementCount;
    if (yCol.value > rowCount) {
      const yNum = yCol.value;
      const row = createRaw();
      [...Array(+xCol.value)].forEach((_, idx) => {
        row.appendChild(cloneCell({
          x: idx + 1,
          y: yNum
        }))
      })
      table.appendChild(row)
    } else {
      table.lastElementChild.remove();
    }
  })

  const genBtn = document.getElementById('gen');
  genBtn.addEventListener('click', () => {
    const xCount = xCol.value;
    const yCount = yCol.value;
    const vals = table.getVals();
    const usableValsCount = vals.filter(val => val != 0).length;
    const totalPointCount = xCount * yCount;
    const gridVals = vals.splice(0, totalPointCount);
    const sinCalcStrs = gridVals.map((f, fIdx) => {
      if (f == 0) {
        return '';
      }
      const xPos = fIdx % xCount + 1.0;
      const yPos = (fIdx / yCount | 0) + 1.0;
      const vecPos = {
        x: (2.0 / xCount) * xPos - 1.0 - (1.0 / xCount) || 0.0,
        y: (2.0 / yCount) * (yCount - yPos) - 1.0 + (1.0 / yCount) || 0.0
      }
      return `sin((-time*0.1+length(signedCoord-vec2(${vecPos.x},${vecPos.y})))*${f.toFixed(1)})`
    }).filter(str => str);

    const fStr = `float noise(float time,vec2 resolution) {vec2 coord=gl_FragCoord.xy/resolution;vec2 signedCoord=coord*2.0-1.0;return (${sinCalcStrs.join('+')})/${(usableValsCount * 2).toFixed(1)}+.5;}`
    navigator.clipboard.writeText(fStr)
      .then(() => {
        localStorage.setItem('shader', fStr);
        console.log('copyed')
      })
  });

  table.getVals = () => {
    const vals = [...table.querySelectorAll('input')].map(input => +input.value)
    return [...vals, ...(Array(100).fill(0))].slice(0, 100);
  }

}

export {
  controller
}

