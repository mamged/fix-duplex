export function buildDuplexOrder(pageCount) {
  const odd = [];
  const even = [];
  for (let i = 0; i < pageCount; i++) {
    const oneBased = i + 1;
    if (oneBased % 2 === 1) odd.push(i);
    else even.push(i);
  }
  
    even.reverse();
    //
//   console.log('even:', even.reverse());
//   console.log('before reverseing even', even)
//   console.log('after reverseing even', even);
    const {arr1: fixedOdd, arr2: fixedEven}  = swappChecked(odd, even)
    console.log('odd:', fixedOdd.map(i=>i+1));
  console.log('even:', fixedEven.map(i=>i+1));
  const final = [...fixedOdd, ...fixedEven];
  console.log('final order', final.map(i=>i+1));
  console.log('final order2', reorderEvenByOddSort(final));
  return [...reorderEvenByOddSort(final)];
}

export function isEvenIndexZeroBased(i) {
  return ((i + 1) % 2) === 0;
}

export function reorderEvenByOddSort(arr) {
  const evens = [];
  const odds = [];
  for (let i = 0; i < arr.length; i++) {
    if (i % 2 === 0) evens.push(arr[i]);
    else odds.push(arr[i]);
  }

//   const oddWithIdx = odds.map((v, i) => ({ v, i }));
//   const sortedOddWithIdx = [...oddWithIdx].sort((a, b) => a.v - b.v);
//   const sortedOdds = sortedOddWithIdx.map(o => o.v);
  const sortedEvens = quickSort(evens);
  let sortedOdds = Array(odds.length).fill();
  sortedOdds = quickSort(odds).reverse()
//   sortedEvens.forEach((i, n)=>{
//     sortedOdds[n] = odds[evens.indexOf(i)];
//   });
  console.log('sortedEvens',sortedEvens.map(i=>i+1))
    console.log('sortedOdds',sortedOdds.map(i=>i+1))
  const total = sortedEvens.length + sortedOdds.length;
  const newConstructed = [];
   Array(Math.max(sortedEvens.length, sortedOdds.length)).fill().map((i,n)=>{
    // newConstructed.push(Math.min(sortedEvens[n],sortedOdds[n]))
    // newConstructed.push(Math.max(sortedEvens[n],sortedOdds[n]))
        if(sortedEvens[n] !== undefined)
            newConstructed.push(sortedEvens[n])
        if(sortedOdds[n] !== undefined)
            newConstructed.push(sortedOdds[n])
  })
  console.log('newConstructed', newConstructed.map(i=>i+1))
  const result = [...sortedEvens, ...sortedOdds];
  return newConstructed;
}
function swappChecked(arr1=[], arr2=[]){
    arr2 = arr2.reverse();
    Array(Math.max(arr1.length, arr2.length)).fill().forEach((i,n)=>{
        const tmp1 = arr1[n];
        const tmp2 = arr2[n]
        if(tmp1>tmp2){
            arr1[n] = tmp2;
            arr2[n] = tmp1;
        }
    });
    return {arr1, arr2: arr2.reverse()}
}
function quickSort(arr) {
  if (arr.length <= 1) return arr.slice();
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    const v = arr[i];
    if (v <= pivot) left.push(v); else right.push(v);
  }
  const ls = quickSort(left);
  const rs = quickSort(right);
  return [...ls, pivot, ...rs];
}

export function reorderOddByEvenSort(arr) {
  const evens = [];
  const odds = [];
  for (let i = 0; i < arr.length; i++) {
    if (i % 2 === 0) evens.push(arr[i]);
    else odds.push(arr[i]);
  }

  const evenWithIdx = evens.map((v, i) => ({ v, i }));
  const sortedEvenWithIdx = [...evenWithIdx].sort((a, b) => a.v - b.v);
  const sortedEvens = sortedEvenWithIdx.map(e => e.v);
  const permNewToOld = sortedEvenWithIdx.map(e => e.i);

  const reorderedOdds = odds.slice();
  for (let newPos = 0; newPos < permNewToOld.length; newPos++) {
    const oldPos = permNewToOld[newPos];
    if (oldPos < odds.length) {
      reorderedOdds[newPos] = odds[oldPos];
    }
  }

  const result = [];
  let e = 0, o = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i % 2 === 0) {
      result[i] = sortedEvens[e] !== undefined ? sortedEvens[e] : evens[e];
      e++;
    } else {
      result[i] = reorderedOdds[o] !== undefined ? reorderedOdds[o] : odds[o];
      o++;
    }
  }

  return result;
}
