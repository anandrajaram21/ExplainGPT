import {useState, useEffect} from "react";
import api from "./utils/api";
import AttentionVisualization from "./components/AttentionVisualization";

export default function App() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");

    function handleGenerate() {
        api.post("/head_view", {prompt: input}).then((res) => {
            console.log(res.data);
            setOutput(res.data);
        });
    }

    return (
        <div>
            <input className="border-2 border-gray-300 rounded-md p-2" type="text" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="bg-blue-500 text-white p-2 rounded-md" onClick={handleGenerate}>Generate</button>
            {output && (
                // <AttentionVisualization data={output} />
                // <div>
                //     <pre>{JSON.stringify(output, null, 2)}</pre>
                // </div>
            )}
        </div>
    )
}

