// engine.js - Motor de Cálculo y AURA con OpenAI

async function handleAura(e) {
    if(e.key === 'Enter') {
        const query = e.target.value.trim();
        if(!query) return;
        const chat = document.getElementById('aura-chat');
        chat.innerHTML += `<div class="msg"><b>Usted:</b> ${query}</div>`;
        e.target.value = "";

        // Preparamos los datos fiscales
        const taxData = {
            agi: parseFloat(document.getElementById('in-agi').value) || 0,
            net: parseFloat(document.getElementById('in-net').value) || 0
        };

        try {
            const res = await fetch('/api/ask-aura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: query, taxData })
            });
            const data = await res.json();
            chat.innerHTML += `<div class="msg msg-strategy"><b>AURA:</b> ${data.answer}</div>`;
            chat.scrollTop = chat.scrollHeight;
        } catch (err) {
            chat.innerHTML += `<div class="msg msg-alert"><b>AURA:</b> Error al comunicarse con OpenAI.</div>`;
        }
    }
}

// Motor fiscal principal
function taxEngine() {
    const taxName = document.getElementById('tax_name').value;
    const filingStatus = document.getElementById('filing_status')?.value || 'single';
    const wages = parseFloat(document.getElementById('in-w2').value) || 0;
    const gross = parseFloat(document.getElementById('in-gross').value) || 0;
    const expenses = parseFloat(document.getElementById('in-exp').value) || 0;

    const netProfit = Math.max(0, gross - expenses);
    document.getElementById('in-net').value = netProfit.toFixed(2);
    document.getElementById('in-schc-link').value = netProfit.toFixed(2);

    const seTaxableIncome = netProfit * 0.9235;
    const seTax = seTaxableIncome * 0.153;
    const seDeduction = seTax / 2;

    const agi = wages + netProfit - seDeduction;
    document.getElementById('in-agi').value = agi.toFixed(2);
    document.getElementById('top-agi').innerText = `$${agi.toLocaleString()}`;

    // Taxable income simplificado
    const standardDeduction = STANDARD_DEDUCTIONS_2026[filingStatus] || STANDARD_DEDUCTIONS_2026.single;
    const taxableIncome = Math.max(0, agi - standardDeduction);

    // Income tax con brackets
    const incomeTax = calculateIncomeTax(taxableIncome, filingStatus);

    const totalOwe = incomeTax + seTax;
    const refund = wages - totalOwe;
    const topRefundEl = document.getElementById('top-refund');
    topRefundEl.innerText = `$${refund >= 0 ? refund.toLocaleString() : '0.00'}`;
    topRefundEl.style.color = refund >= 0 ? "#00FF00" : "#FF3131";

    // Riesgo IRS
    updateAuraAdvise(netProfit, expenses, gross, agi, filingStatus);
}

function calculateIncomeTax(taxableIncome, filingStatus) {
    let tax = 0;
    let remaining = taxableIncome;
    const brackets = TAX_BRACKETS_2026[filingStatus] || TAX_BRACKETS_2026.single;

    for(let i=0; i<brackets.length; i++){
        const prevLimit = i === 0 ? 0 : brackets[i-1].limit;
        const amount = Math.min(remaining, brackets[i].limit - prevLimit);
        if(amount > 0){
            tax += amount * brackets[i].rate;
            remaining -= amount;
        } else break;
    }
    return tax;
}

function updateAuraAdvise(net, exp, gross, agi, filingStatus){
    const rb = document.getElementById('risk-box');
    if(exp > (gross*0.6) && gross>0){
        rb.innerText = "AUDIT RISK: HIGH";
        rb.className = "risk-badge risk-high";
        pushAura("⚠️ ALERTA: Gastos elevados. Prepare documentación para el IRS.", "msg msg-alert");
    } else {
        rb.innerText = "AUDIT RISK: LOW";
        rb.className = "risk-badge risk-low";
    }

    if(net > 60000 && filingStatus!=='mfs'){
        pushAura(`💡 ESTRATEGIA: Considera S-Corp para ahorrar Self-Employment Tax con Net Profit de $${net.toLocaleString()}`, "msg msg-strategy");
    }

    if(agi > 150000 && filingStatus!=='mfs'){
        pushAura("🚨 ALERTA AVANZADA: AGI elevado. Revise posibles implicaciones de AMT.", "msg msg-alert");
    }
}

function pushAura(msg, cls="msg") {
    const chat = document.getElementById('aura-chat');
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function handleAI(e){ handleAura(e); }

function switchMode(mode){
    document.getElementById('client-view').innerText = mode.toUpperCase() + " MODE";
    pushAura(`Modo <b>${mode}</b> activado. Detalles ${mode==='CPA'?'técnicos':'simples'}.`, "msg");
}

function tab(id){
    document.querySelectorAll('.workspace > div').forEach(d=>d.classList.add('hidden'));
    document.getElementById('t-'+id).classList.remove('hidden');
}

function clearDoubts(){
    const agi = document.getElementById('in-agi').value;
    pushAura(`
<b>Explicación Paso a Paso:</b><br>
1. AGI: $${agi}.<br>
2. Cálculo de impuestos basado en W-2 y Net Profit.<br>
3. Se considera la deducción estándar y Self-Employment Tax.<br>
4. Resultado: Refund o impuesto a pagar calculado automáticamente.
`, "msg msg-strategy");
}

function resetSystem(){ if(confirm("Borrar todos los datos?")) location.reload(); }

document.addEventListener('DOMContentLoaded', taxEngine);
