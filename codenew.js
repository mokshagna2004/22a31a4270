import fs from "fs";

function decodeValue(baseStr, valStr) {
    const base = parseInt(baseStr, 10);
    let s = valStr.trim().toLowerCase();
    let acc = 0n;
    for (let ch of s) {
        let digit;
        if (ch >= "0" && ch <= "9") {
            digit = BigInt(ch.charCodeAt(0) - 48);
        }
        else if (ch >= "a" && ch <= "z") {
            digit = BigInt(ch.charCodeAt(0) - 97 + 10);
        }
        else {
            throw new Error("Invalid char in value: " + ch);
        }
        if (digit >= BigInt(base)) {
            throw new Error(`Digit ${ch} out of range for base ${base}`);
        }
        acc = acc * BigInt(base) + digit;
    }
    return acc;
}

function computeSecret(obj) {
    const k = parseInt(obj.keys.k, 10);

    const pts = [];
    for (const key of Object.keys(obj)) {
        if (key === "keys") continue;

        const num = obj[key];
        const x = BigInt(key);
        const y = decodeValue(num.base.toString(), num.value.toString());
        pts.push({ x, y });
    }
    pts.sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0));
    const use = pts.slice(0, k);

    let num = 0n;
    let den = 1n;
    for (let i = 0; i < use.length; i++) {
        let xi = use[i].x;
        let yi = use[i].y;

        let li_num = 1n;
        let li_den = 1n;
        for (let j = 0; j < use.length; j++) {
            if (i === j) continue;
            li_num *= -use[j].x;
            li_den *= xi - use[j].x;
        }

        num = num * li_den + yi * li_num * den;
        den *= li_den;

        const g = gcd(num < 0n ? -num : num, den < 0n ? -den : den);
        num /= g;
        den /= g;
    }

    if (den < 0n) {
        num = -num;
        den = -den;
    }

    if (num % den !== 0n) throw new Error("Non-integer result");

    let result = num / den;
    if (result < 0n) result = -result;
    return result;
}

function gcd(a, b) {
    while (b !== 0n) {
        let t = a % b;
        a = b;
        b = t;
    }
    return a;
}

function main() {
    const args = process.argv.slice(2);
    const files = args.length > 0 ? args : ["test1.json", "test2.json"];
    const outputs = [];
    for (const file of files) {
        const raw = fs.readFileSync(file, "utf8");
        const obj = JSON.parse(raw);
        const secret = computeSecret(obj);
        outputs.push(secret.toString());
    }
    console.log(outputs.join("\n"));
}

main();