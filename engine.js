// engine.js - Motor de cálculo + AURA OpenAI
async function askOpenAI(prompt, taxData) {
    try {
        const res = await fetch('https://tu-backend.onrender.com/api/ask-aura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, taxData })
        });
        const data = await res.json();
        return data.answer;
    } catch(e) {
        return "AURA: No pude conectarme al servidor OpenAI. Intente más tarde.";
    }
}

function taxEngine() {
    const taxName = document.getElementById('tax_name').value;
    const filingStatus = "single"; // Puedes agregar select más adelante
    const wages = parseFloat(document.getElementById('in-w2').value) || 0;
    const gross = parseFloat(document.getElementById('in-gross').value) || 0;
    const expenses = parseFloat(document.getElementById('in-exp').value) || 0;

    const netProfit = Math.max(0, gross - expenses);
    document.getElementById('in-net').value = netProfit.toFixed(2);
    document.getElementById('sc-net').value = netProfit.toFixed(2);

    const seTax = netProfit * 0.9235 * 0.153;
    const agi = wages + netProfit - seTax / 2;
    document.getElementById('in-agi').value = agi.toFixed(2);

    const standardDeduction = 15700;
    const taxableIncome = Math.max(0, agi - standardDeduction);
    document.getElementById('in-taxable').value = taxableIncome.toFixed(2);

    // Cálculo simple de Income Tax usando brackets
    const incomeTax = calculateIncomeTax(taxableIncome, filingStatus);
    const totalOwe = incomeTax + seTax;
    document.getElementById('display-owe').value = totalOwe.toFixed(2);

    updateRiskAlerts(gross, expenses, netProfit, agi);
}

function calculateIncomeTax(taxableIncome, filingStatus) {
    const brackets = TAX_BRACKETS_2026[filingStatus];
    let remaining = taxableIncome, tax = 0;
    for(let i=0; i<brackets.length; i++){
        const prevLimit = i===0 ? 0 : brackets[i-1].limit;
        const amount = Math.min(remaining, brackets[i].limit - prevLimit);
        if(amount > 0) {
            tax += amount * brackets[i].rate;
            remaining -= amount;
        } else break;
    }
    return tax;
}

function updateRiskAlerts(gross, expenses, net, agi){
    const rb = document.getElementById('risk-box');
    if(expenses > gross*0.6 && gross>0){
        rb.innerText="AUDIT RISK: HIGH";
        rb.className="risk-badge risk-high";
    } else {
        rb.innerText="AUDIT RISK: LOW";
        rb.className="risk-badge risk-low";
    }
}

async function handleAura(e){
    if(e.key === "Enter"){
        const query = e.target.value;
        const chat = document.getElementById('aura-chat');
        const taxData = {
            agi: parseFloat(document.getElementById('in-agi').value)||0,
            net: parseFloat(document.getElementById('in-net').value)||0,
            gross: parseFloat(document.getElementById('in-gross').value)||0,
            expenses: parseFloat(document.getElementById('in-exp').value)||0
        };

        chat.innerHTML += `<div class="msg"><b>Usted:</b> ${query}</div>`;
        e.target.value="";

        const answer = await askOpenAI(query, taxData);
        chat.innerHTML += `<div class="msg msg-strategy"><b>AURA:</b> ${answer}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

function resetSystem(){
    if(confirm("¿Desea borrar todos los datos de esta sesión?")) location.reload();
}

function switchMode(mode){
    document.getElementById('client-view').innerText = mode.toUpperCase() + " MODE";
}

function tab(id){
    document.querySelectorAll('.workspace > div').forEach(d=>d.classList.add('hidden'));
    document.getElementById('t-'+id).classList.remove('hidden');
}

function explainAll(){
    const taxData = {
        agi: parseFloat(document.getElementById('in-agi').value)||0,
        net: parseFloat(document.getElementById('in-net').value)||0,
        gross: parseFloat(document.getElementById('in-gross').value)||0,
        expenses: parseFloat(document.getElementById('in-exp').value)||0
    };
    handleAura({ key:'Enter', target:{ value:'Explícame línea por línea cada cálculo fiscal basado en mis datos',}} );
}

document.addEventListener('DOMContentLoaded',()=>{ taxEngine(); });
