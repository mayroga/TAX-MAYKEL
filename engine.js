// engine.js - Motor de Cálculo y Asesor AURA

function calculateIncomeTax(taxableIncome, filingStatus) {
    let tax = 0;
    let remainingIncome = taxableIncome;
    const brackets = TAX_BRACKETS_2026[filingStatus];

    if (!brackets) {
        console.error("Filing status not found for tax brackets:", filingStatus);
        return 0; // Fallback
    }

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const prevLimit = (i === 0) ? 0 : brackets[i-1].limit;
        const bracketAmount = Math.min(remainingIncome, bracket.limit - prevLimit);
        
        if (bracketAmount > 0) {
            tax += bracketAmount * bracket.rate;
            remainingIncome -= bracketAmount;
        } else {
            break; // No more income in this bracket
        }
    }
    return tax;
}


function taxEngine() {
    // 1. Inputs
    const taxName = document.getElementById('tax_name').value;
    const filingStatus = document.getElementById('filing_status').value;
    const wages = parseFloat(document.getElementById('in-w2').value) || 0;
    const gross = parseFloat(document.getElementById('in-gross').value) || 0;
    const expenses = parseFloat(document.getElementById('in-exp').value) || 0;

    // 2. Schedule C Calculation
    const netProfit = Math.max(0, gross - expenses);
    document.getElementById('in-net').value = netProfit.toFixed(2);
    document.getElementById('in-schc-link').value = netProfit.toFixed(2);

    // 3. Self-Employment Tax (Schedule SE)
    const seTaxableIncome = netProfit * 0.9235; // Net earnings from self-employment
    const seTax = seTaxableIncome * 0.153; // 15.3% for Social Security and Medicare
    const seDeduction = seTax / 2; // Deductible portion of SE tax

    // 4. AGI (Adjusted Gross Income)
    const agi = (wages + netProfit) - seDeduction;
    document.getElementById('in-agi').value = agi.toFixed(2);
    document.getElementById('display-agi').innerText = `$${agi.toLocaleString()}`;

    // 5. Standard Deduction
    const standardDeduction = STANDARD_DEDUCTIONS_2026[filingStatus] || STANDARD_DEDUCTIONS_2026.single;
    // (Nota: En un sistema real, se compararían con las itemizadas y se tomaría la mayor)

    // 6. Taxable Income
    const taxableIncome = Math.max(0, agi - standardDeduction);

    // 7. Income Tax (using brackets)
    const incomeTax = calculateIncomeTax(taxableIncome, filingStatus);

    // 8. Total Owe / Refund
    const totalOwe = incomeTax + seTax; // (Simplificado, no considera retenciones pagadas, solo el total de impuestos)
    document.getElementById('display-owe').innerText = `$${totalOwe.toLocaleString()}`;

    // Update UI name
    document.getElementById('display-name').innerText = taxName || "---";

    // AURA Advising (based on new calculations)
    updateAuraAdvise(netProfit, expenses, gross, agi, filingStatus);
}

// ASESOR ESPECIALISTA AURA
function handleAura(e) {
    if(e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        const chat = document.getElementById('aura-chat');
        let reply = "Como especialista, le informo que para esa consulta es fundamental revisar la Publicación 17 del IRS.";

        // Base de Conocimiento IA más detallada
        if(query.includes("home office")) reply = "El 'Home Office' (Form 8829) requiere que el espacio sea EXCLUSIVO y REGULAR para el negocio. Puede usar el método simplificado ($5 por pie cuadrado hasta 300 sqft) o calcular gastos reales como hipoteca, seguros, etc., prorrateados.";
        if(query.includes("comidas")) reply = "Las comidas de negocios son deducibles al 50% en 2026, siempre que sean con un propósito comercial claro. DEBE conservar recibos y documentar con quién comió y el tema de negocio.";
        if(query.includes("s-corp")) reply = "Si su Net Profit supera los $60,000-$80,000, la conversión a S-Corp puede generar ahorros significativos en Self-Employment Tax al pagar un salario razonable y tomar el resto como distribución.";
        if(query.includes("1099-nec")) reply = "Debe emitir un Form 1099-NEC antes del 31 de enero a cualquier contratista o individuo al que le haya pagado $600 o más en servicios durante el año.";
        if(query.includes("deducciones estándar")) reply = `La deducción estándar para ${document.getElementById('filing_status').value} en 2026 es de $${STANDARD_DEDUCTIONS_2026[document.getElementById('filing_status').value] || STANDARD_DEDUCTIONS_2026.single}.`;
        if(query.includes("tax brackets") || query.includes("tasas impositivas")) reply = `Las tasas impositivas federales para ${document.getElementById('filing_status').value} en 2026 inician en el 10% hasta $${TAX_BRACKETS_2026[document.getElementById('filing_status').value][0].limit.toLocaleString()} y aumentan progresivamente.`;
        if(query.includes("agi")) reply = "El AGI (Adjusted Gross Income) es la suma de todos sus ingresos menos ciertas deducciones 'above-the-line' como la mitad del Self-Employment Tax. Es crucial para calificar a muchos créditos.";
        if(query.includes("depreciación")) reply = "La depreciación (Form 4562) permite deducir el costo de un activo a lo largo de su vida útil. Hay opciones como la Sección 179 o la depreciación de bonificación para deducir más en el primer año.";


        chat.innerHTML += `<p><strong>Usted:</strong> ${e.target.value}</p>`;
        chat.innerHTML += `<p class="bot"><strong>AURA:</strong> ${reply}</p>`;
        e.target.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
}

function pushAura(msg, type = "normal") {
    const chat = document.getElementById('aura-chat');
    let color = type === "alert" ? "red" : "#2e7d32";
    chat.innerHTML += `<p class="bot" style="color:${color};"><strong>AURA:</strong> ${msg}</p>`;
    chat.scrollTop = chat.scrollHeight;
}

function updateAuraAdvise(net, exp, gross, agi, filingStatus) {
    if(expenses > (gross * 0.6) && gross > 0) {
        pushAura("⚠️ ALERTA: Gastos excesivos detectados. El IRS podría cuestionar la rentabilidad del negocio. Prepare pruebas de millaje, recibos y justificación.", "alert");
    }
    if(net > 60000 && filingStatus !== 'mfs') { // S-Corp no aplica igual para MFS
        pushAura(`💡 ESTRATEGIA: Con un Net Profit de $${net.toLocaleString()}, considere la conversión a S-Corp. Podría ahorrar significativamente en Self-Employment Tax.`);
    }
    if (agi > 150000 && filingStatus !== 'mfs') { // Umbral para empezar a considerar AMT
        pushAura("🚨 AVISO AVANZADO: Su AGI es elevado. Revise si aplica el Impuesto Mínimo Alternativo (AMT). Un contador experimentado puede ayudarle aquí.", "alert");
    }
}

function switchForm(formId) {
    document.querySelectorAll('.tax-form').forEach(f => f.classList.add('hidden'));
    document.getElementById('form-' + formId).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');
}

function resetSystem() {
    if(confirm("¿Desea borrar todos los datos de esta sesión por seguridad?")) {
        location.reload();
    }
}

// Initial calculation on load
document.addEventListener('DOMContentLoaded', () => {
    taxEngine(); 
    // Set initial name and status display
    document.getElementById('display-name').innerText = document.getElementById('tax_name').value || "---";
});
