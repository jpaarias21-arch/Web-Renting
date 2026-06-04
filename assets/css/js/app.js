const SUPABASE_URL = "https://jmnkbvfdomhlmpfedzyc.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmtidmZkb21obG1wZmVkenljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzU3MDEsImV4cCI6MjA5NTkxMTcwMX0.PWqfkJpPXhifJA8LxDomnOrmKbes-0HSxSG6j477iiM";

let supabase;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase conectado sin problemas.");
    }
} catch (error) {
    console.error("Error al conectar Supabase:", error);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("booking-form");
    if (form) {
        form.addEventListener("submit", procesarReserva);
    }
});

async function procesarReserva(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const fecha_entrada = document.getElementById("fecha_entrada").value;
    const fecha_salida = document.getElementById("fecha_salida").value;
    const villa_interes = document.getElementById("villa_interes").value;
    const adultos = parseInt(document.getElementById("adultos").value, 10);
    const ninos = parseInt(document.getElementById("ninos").value, 10) || 0;
    const notas = document.getElementById("notas").value;

    if (new Date(fecha_entrada) >= new Date(fecha_salida)) {
        alert("La fecha de entrada debe ser anterior a la fecha de salida.");
        return;
    }

    // Inserción en la base de datos (CRM)
    if (supabase) {
        try {
            const { error } = await supabase
                .from("clientes_reservas")
                .insert([
                    {
                        nombre,
                        telefono,
                        fecha_entrada,
                        fecha_salida,
                        villa_interes,
                        adultos,
                        ninos,
                        notas
                    }
                ]);

            if (error) {
                console.error("Error en Supabase:", error.message);
            } else {
                console.log("Datos de huésped guardados.");
            }
        } catch (err) {
            console.error("Error de red:", err);
        }
    }

    // Redirección directa a WhatsApp
    const WHATSAPP_NUMBER = "50688888888"; // <-- Pon el número real del dueño aquí
    const textoMensaje = 
`🌅 *SOLICITUD DE RESERVA — CARRILLO SUNSET* 🌅

*Residencia Solicitada:*
🏨 ${villa_interes}

*Datos del Huésped:*
👤 *Nombre:* ${nombre}
📱 *Teléfono:* ${telefono}

*Detalles de la Estancia:*
📅 *Check-In:* ${fecha_entrada}
📅 *Check-Out:* ${fecha_salida}
👥 *Pasajeros:* ${adultos} Adultos / ${ninos} Niños

*Notas Adicionales:*
📝 _"${notas || 'Ninguna'}"_

_Este registro se guardó automáticamente en tu panel CRM de Supabase para su posterior exportación a Excel._`;

    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(textoMensaje)}`, "_blank");
}