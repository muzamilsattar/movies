import { useEffect, useState } from "react";

export default function Currency() {
    // `https://api.frankfurter.app/latest?amount=100&from=EUR&to=USD`
const [amount,setAmount]=useState('');

const[fromCurr,setFromCurr]=useState('EUR');

const[toCurr,setToCurr]=useState('USD')

const [converted,setConverted]=useState('')

const [isLoading,setIsLoading]=useState(false)

function handleFrom(e) {
  setFromCurr(e.target.value);
}

function handleTo(e) {
  setToCurr(e.target.value);
}

const handleChange = (e) => {
  setAmount(Number(e.target.value));
};

useEffect(function(){
async function convert(){
  setIsLoading(true)
  const res=await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurr}&to=${toCurr}`)
const data= await res.json()
setConverted(data.rates[toCurr])
setIsLoading(false)
}
if(fromCurr===toCurr||amount===0) return setConverted(amount)
convert()
},[amount,fromCurr,toCurr])

  return (
    <div className="bg-red-400 p-12 rounded-md">
      <input disabled={isLoading} value={amount} onChange={handleChange} placeholder="Enter Amount" className="focus:outline-red-500 bg-cyan-300 text-black  text-blue py-5 text-5xl rounded-xl  placeholder:text-slate-800 font-bold" type="text" />
      <select disabled={isLoading} onChange={handleFrom} value={fromCurr} className="hover:cursor-pointer bg-cyan-400 text-black   py-5 text-5xl rounded-xl  placeholder:text-slate-800">
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="CAD">CAD</option>
        <option value="INR">INR</option>
      </select>

      <select disabled={isLoading} onChange={handleTo} value={toCurr} className="hover:cursor-pointer bg-cyan-200 text-black   py-5 text-5xl rounded-xl  placeholder:text-slate-800">
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="CAD">CAD</option>
        <option value="INR">INR</option>
      </select>
      <p className="text-black text-3xl font-semibold mt-3">{`${converted} ${toCurr}`}</p>
    </div>
  );
}


