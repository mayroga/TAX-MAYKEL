// MOTOR DE CÁLCULO TAX-ENGINE
function taxEngine() {
    const wages = parseFloat(document.getElementById('in-w2').value) || 0;
    const gross = parseFloat(document.getElementById('in-gross').value) || 0;
    const expenses = parseFloat(document.getElementById('in-exp').value) || 0;

    // 1. Cálculo Schedule C
    const netProfit = Math.max(0, gross - expenses);
    document.getElementById('in-net').value = netProfit.toFixed(2);
    document.getElementById('in-schc-link').value = netProfit.toFixed(2);

    // 2. Cálculo SE Tax (Self-Employment)
    const seTax = netProfit * 0.9235 * 0.153;
    const seDeduction = seTax / 2;

    // 3. AGI
    const agi = (wages + netProfit) - seDeduction;
    document.getElementById('in-agi').value = agi.toFixed(2);
    document.getElementById('display-agi').innerText = `$${agi.toLocaleString()}`;

    // 4. Refund/Owe (Simplified 2026)
    const taxable = Math.max(0, agi - 15000); // Standard Ded.
    const finalTax = (taxable * 0.12) + seTax;
    document.getElementById('display-owe').innerText = `$${finalTax.toLocaleString()}`;

    // Alerta de Riesgo Automática
    if(expenses > (gross * 0.6) && gross > 0) {
        pushAura("⚠️ ALERTA: Los gastos superan el 60% del ingreso. El IRS marcará esto como anomalía (Red Flag). Verifique millaje.");
    }
}

// ASESOR ESPECIALISTA AURA
function handleAura(e) {
    if(e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        const chat = document.getElementById('aura-chat');
        let reply = "Como especialista, le informo que debe consultar la Publicación 535 del IRS para esa deducción.";

        // Base de Conocimiento IA
        if(query.includes("home office")) reply = "El 'Home Office' requiere uso EXCLUSIVO. Puede deducir $5 por sqft hasta 300 sqft o gastos reales prorrateados.";
        if(query.includes("comidas")) reply = "Las comidas de negocios tienen un límite del 50% de deducibilidad en 2026. Guarde recibos con propósito comercial.";
        if(query.includes("s-corp")) reply = "Si su Net Profit supera los $60,000, la conversión a S-Corp le ahorraría el 15.3% de SE Tax sobre las distribuciones.";
        if(query.includes("1099")) reply = "Todo pago a contratistas mayor a $600 requiere obligatoriamente enviar el Form 1099-NEC antes del 31 de enero.";

        chat.innerHTML += `<p><strong>Usted:</strong> ${e.target.value}</p>`;
        chat.innerHTML += `<p class="bot"><strong>AURA:</strong> ${reply}</p>`;
        e.target.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
}

function pushAura(msg) {
    const chat = document.getElementById('aura-chat');
    chat.innerHTML += `<p class="bot" style="color:red;"><strong>AURA:</strong> ${msg}</p>`;
}

function switchForm(formId) {
    document.querySelectorAll('.tax-form').forEach(f => f.classList.add('hidden'));
    document.getElementById('form-' + formId).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');
}

function resetSystem() {
    if(confirm("¿Borrar todos los datos de esta sesión?")) location.reload();
}
