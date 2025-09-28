// pages/index.tsx
// Next.js Pages Router page: "/convert"
// Features:
// 1) Python String -> Python Code (multiline) + Download .py
// 2) Python Code (multiline) -> Python String (single-line escaped) + Download .txt
// TailwindCSS styling. No external libs.
// Layout: INPUT controls first, then a BIG OUTPUT panel at the bottom.

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

/* -------------------- helpers -------------------- */
function stripOnePairWrap(s: string): string {
    if (s.length < 2) return s;
    const first = s[0];
    const last = s[s.length - 1];
    if (
        (first === '"' && last === '"') ||
        (first === "'" && last === "'") ||
        (first === "`" && last === "`")
    ) {
        return s.slice(1, -1);
    }
    return s;
}

function decodePythonOneLine(src: string): string {
    if (!src) return "";
    let s = src.trim();
    s = stripOnePairWrap(s);

    // IMPORTANT: order matters
    s = s
        .replaceAll(/\\\\/g, "\\") // \\ -> \
        .replaceAll(/\\n/g, "\n") // \n -> newline
        .replaceAll(/\\r/g, "\r") // \r -> CR
        .replaceAll(/\\t/g, "\t") // \t -> tab
        .replaceAll(/\\"/g, '"') // \" -> "
        .replaceAll(/\\'/g, "'"); // \' -> '
    return s;
}

function encodePythonToOneLine(
    code: string,
    quote: "double" | "single" = "double"
): string {
    // Convert multiline code to a one-line Python string literal (including surrounding quotes).
    let s = code ?? "";

    // Normalize newlines
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Escape order is critical
    s = s
        .replace(/\\/g, "\\\\") // \ -> \\
        .replace(/\n/g, "\\n") // newline -> \n
        .replace(/\t/g, "\\t"); // tab -> \t

    if (quote === "double") {
        s = s.replace(/"/g, '\\"');
        return `"${s}"`;
    } else {
        s = s.replace(/'/g, "\\'");
        return `'${s}'`;
    }
}

async function copyToClipboard(text: string) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // ignore
    }
}

/* -------------------- page -------------------- */
export default function ConvertPage() {
    // tabs
    const [tab, setTab] = useState<"str2py" | "py2str">("str2py");

    // String -> Code
    const [raw, setRaw] = useState("");
    const [converted, setConverted] = useState("");
    const [autoShebang, setAutoShebang] = useState(true);
    const [fileNamePy, setFileNamePy] = useState("output.py");
    const txtInputRef = useRef<HTMLInputElement | null>(null);

    // Code -> String
    const [code, setCode] = useState("");
    const [quoteType, setQuoteType] = useState<"double" | "single">("double");
    const [encoded, setEncoded] = useState("");
    const [fileNameTxt, setFileNameTxt] = useState("one_line.txt");
    const pyInputRef = useRef<HTMLInputElement | null>(null);

    const exampleStr = useMemo(
        () =>
            String(
                "\"#!/usr/bin/env python3\\nprint(\\\"Hello, Tar!\\\")\\nfor i in range(3):\\n\\tprint(i)\\n\""
            ),
        []
    );

    const exampleCode = useMemo(
        () =>
            `#!/usr/bin/env python3
print("Hello, Tar!")
for i in range(3):
\tprint(i)
`,
        []
    );

    // ----- actions: String -> Code
    const doConvertStr2Py = useCallback(() => {
        let body = decodePythonOneLine(raw);
        if (autoShebang && body.trim() && !/^#!/.test(body)) {
            body = `#!/usr/bin/env python3\n${body}`;
        }
        setConverted(body);
    }, [raw, autoShebang]);

    const doDownloadPy = useCallback(() => {
        const codeOut = (converted || decodePythonOneLine(raw)) || "";
        if (!codeOut.trim()) return;
        const blob = new Blob([codeOut], { type: "text/x-python" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileNamePy || "output.py";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [converted, raw, fileNamePy]);

    // ----- actions: Code -> String
    const doConvertPy2Str = useCallback(() => {
        const s = encodePythonToOneLine(code, quoteType);
        setEncoded(s);
    }, [code, quoteType]);

    const doDownloadTxt = useCallback(() => {
        const s = encoded || encodePythonToOneLine(code, quoteType);
        const blob = new Blob([s + "\n"], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileNameTxt || "one_line.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [encoded, code, quoteType, fileNameTxt]);

    // ----- derived outputs for the big panel -----
    const bigOutput =
        tab === "str2py"
            ? (converted || decodePythonOneLine(raw)) ||
            "# (converted code will appear here)"
            : (encoded || encodePythonToOneLine(code, quoteType)) || '""';

    const bigOutputLabel =
        tab === "str2py" ? "Output: Python code" : "Output: one-line Python string";

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Python Converter</h1>
                <p className="text-sm text-gray-500">
                    Two-way conversion between a one-line Python string and real Python
                    code.
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 inline-flex rounded-2xl border bg-white p-1 shadow-sm">
                <button
                    type="button"
                    onClick={() => setTab("str2py")}
                    className={`rounded-xl px-4 py-2 text-sm ${
                        tab === "str2py" ? "bg-indigo-600 text-white" : "hover:bg-gray-50"
                    }`}
                >
                    String → Code
                </button>
                <button
                    type="button"
                    onClick={() => setTab("py2str")}
                    className={`rounded-xl px-4 py-2 text-sm ${
                        tab === "py2str" ? "bg-indigo-600 text-white" : "hover:bg-gray-50"
                    }`}
                >
                    Code → String
                </button>
            </div>

            {/* INPUT AREA (controls) */}
            {tab === "str2py" ? (
                <div className="space-y-3">
                    <label className="block text-sm font-medium">
                        Input: one-line Python string
                    </label>
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        className="h-48 w-full rounded-2xl border bg-white p-3 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Paste like: "print(\\"hi\\")\\nfor x in range(3):\\n\\tprint(x)\\n"`}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            ref={txtInputRef}
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (f) setRaw(await f.text());
                                if (txtInputRef.current) txtInputRef.current.value = "";
                            }}
                        />
                        <button
                            onClick={() => txtInputRef.current?.click()}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Upload .txt
                        </button>
                        <button
                            onClick={() => setRaw(exampleStr)}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Load sample
                        </button>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={autoShebang}
                                onChange={(e) => setAutoShebang(e.target.checked)}
                            />
                            Add shebang if missing
                        </label>
                        <button
                            onClick={() => {
                                setRaw("");
                                setConverted("");
                            }}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Clear
                        </button>
                        <div className="ml-auto flex items-center gap-3">
                            <input
                                className="w-56 rounded-xl border px-3 py-2 text-sm"
                                value={fileNamePy}
                                onChange={(e) => setFileNamePy(e.target.value)}
                                placeholder="output.py"
                            />
                            <button
                                onClick={doConvertStr2Py}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                            >
                                Convert
                            </button>
                            <button
                                onClick={() =>
                                    copyToClipboard(converted || decodePythonOneLine(raw))
                                }
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Copy
                            </button>
                            <button
                                onClick={doDownloadPy}
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Download .py
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Mirrors your shell POC (sed for \n & \" unescape) and also handles
                        \r, \t, \' and \\.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <label className="block text-sm font-medium">
                        Input: Python code (multiline)
                    </label>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-48 w-full rounded-2xl border bg-white p-3 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`#!/usr/bin/env python3
print("Hello")
for i in range(3):
\tprint(i)`}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            ref={pyInputRef}
                            type="file"
                            accept=".py,.txt"
                            className="hidden"
                            onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (f) setCode(await f.text());
                                if (pyInputRef.current) pyInputRef.current.value = "";
                            }}
                        />
                        <button
                            onClick={() => pyInputRef.current?.click()}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Upload .py/.txt
                        </button>
                        <button
                            onClick={() => setCode(exampleCode)}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Load sample
                        </button>
                        <div className="flex items-center gap-2 text-sm">
                            <span>Quote:</span>
                            <label className="flex items-center gap-1">
                                <input
                                    type="radio"
                                    checked={quoteType === "double"}
                                    onChange={() => setQuoteType("double")}
                                />{" "}
                                double (")
                            </label>
                            <label className="flex items-center gap-1">
                                <input
                                    type="radio"
                                    checked={quoteType === "single"}
                                    onChange={() => setQuoteType("single")}
                                />{" "}
                                single (')
                            </label>
                        </div>
                        <button
                            onClick={() => {
                                setCode("");
                                setEncoded("");
                            }}
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Clear
                        </button>
                        <div className="ml-auto flex items-center gap-3">
                            <input
                                className="w-56 rounded-xl border px-3 py-2 text-sm"
                                value={fileNameTxt}
                                onChange={(e) => setFileNameTxt(e.target.value)}
                                placeholder="one_line.txt"
                            />
                            <button
                                onClick={doConvertPy2Str}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                            >
                                Convert
                            </button>
                            <button
                                onClick={() =>
                                    copyToClipboard(
                                        encoded || encodePythonToOneLine(code, quoteType)
                                    )
                                }
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Copy
                            </button>
                            <button
                                onClick={doDownloadTxt}
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Download .txt
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Encodes backslashes first, then newlines/tabs; escapes quotes per
                        your selected quote style.
                    </p>
                </div>
            )}

            {/* BIG OUTPUT PANEL AT THE BOTTOM */}
            <div className="mt-8">
                <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium">{bigOutputLabel}</label>
                    <span className="text-xs text-gray-500">
            (read-only preview; use Copy/Download in controls above)
          </span>
                </div>
                <div className="h-[65vh] w-full overflow-auto rounded-2xl bg-[#0f1c2e] p-5 text-base text-white shadow-inner ring-1 ring-black/10">
                    <SyntaxHighlighter
                        language="python"
                        style={vscDarkPlus}
                        customStyle={{
                            borderRadius: "1rem",
                            padding: "1.25rem",
                            height: "65vh",
                            overflow: "auto",
                            background: "#0f1c2e",
                            fontSize: "0.9rem",
                        }}
                    >
                        {bigOutput}
                    </SyntaxHighlighter>
                </div>
            </div>
        </div>
    );
}
