"use client"

import { API_URL } from "@/lib/config"

export function PredictionCLV() {

    fetch(`${API_URL}/api/`)

    return (
        <>
            <p>hola mundo, prediction clv</p>
        </>
    )
}