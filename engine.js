// engine.js – Tax Engine + AURA Advisor

function calculateIncomeTax(taxableIncome, filingStatus) {
    let tax = 0;
    let remaining = taxableIncome;
    const brackets = TAX_BRACKETS_2026[filingStatus] || TAX_BRACKETS_2026.single;

    for (let i = 0; i < brackets.length; i++) {
        const prev = i === 0 ? 0 : brackets[i - 1].limit;
        const taxable = Math.min(remaining, brackets[i].limit - prev);

        if (taxable <= 0) break;
        tax += taxable * brackets[i].rate;
        remaining -= taxable;
    }
    return tax;
}

function taxEngine() {
    const wages = +in_w2.value || 0;
    const gross = +in_gross.value || 0;
    const exp = +in_exp.value || 0;
    const status = filing_status.value;

    const net = Math.max(0, gross - exp);
    in_net.value = net.toFixed(2);
    in_schc_link.value = net.toFixed(2);

    const seTax = net * 0.9235 * 0.153;
    const agi = wages + net - (seTax / 2);

    in_agi.value = agi.toFixed(2);
    display_agi.innerText = `$${agi.toLocaleString()}`;

    const std = STANDARD_DEDUCTIONS_2026[status];
    const taxableIncome = Math.max(0, agi - std);
    const incomeTax = calculateIncomeTax(taxableIncome, status);

    display_owe.innerText = `$${(incomeTax + seTax).toLocaleString()}`;

    updateAuraAdvise(net, exp, gross, agi, status);
}

function updateAuraAdvise(net, exp, gross, agi, status) {
    if (exp > gross * 0.6 && gross > 0) {
        pushAura("⚠️ Gastos agresivos. Riesgo de auditoría elevado.", "alert");
    }
    if (net > 60000 && status !== "mfs") {
        pushAura("💡 Estrategia: considere S-Corp para reducir SE Tax.");
    }
    if (agi > 150000) {
        pushAura("🚨 AGI alto: evalúe AMT con un CPA.", "alert");
    }
}

function pushAura(msg, type = "normal") {
    aura_chat.innerHTML += `<p class="bot ${type}"><b>AURA:</b> ${msg}</p>`;
}
