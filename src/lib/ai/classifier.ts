// src/lib/ai/classifier.ts
import { NeuralNetwork } from './mini-brain';
import { browser } from '$app/environment';

// --- Definiciones de Categorías ---

export const DISTRIBUTION_LABELS = [
    'Equilibrada',    // 0
    'Cuesta Abajo',   // 1
    'Cuesta Arriba',  // 2
    'Pirámide',       // 3
    'Valle',          // 4
    'Montaña Rusa',   // 5
    'Viernes Libre',  // 6 (Nuevo)
    'Lunes Relax'     // 7 (Nuevo)
] as const;

export const RHYTHM_LABELS = [
    'Reloj Suizo',    // 0
    'Alondra',        // 1
    'Búho',           // 2
    'Bifásico',       // 3
    'Caótico',        // 4
    'Escalador',      // 5 (Nuevo: cada día más tarde)
    'Despertar'       // 6 (Nuevo: cada día más temprano)
] as const;

export const DESCRIPTIONS = {
    distribution: {
        'Equilibrada': 'Tu carga académica es constante. La consistencia es clave, ni muy relajado ni muy estresado.',
        'Cuesta Abajo': 'Empiezas la semana con todo y te vas liberando. ¡El fin de semana llega antes para ti!',
        'Cuesta Arriba': 'La semana se pone más difícil cada día. Resiste, el viernes es el último empujón.',
        'Pirámide': 'El miércoles es tu día crítico. Si sobrevives a la mitad de semana, el resto es bajada.',
        'Valle': 'Lunes y Viernes cargados, pero un descanso a mitad de semana. Un sandwich invertido de estrés.',
        'Montaña Rusa': 'Días horribles alternados con días tranquilos. Tu estabilidad emocional está a prueba.',
        'Viernes Libre': 'El sueño de todo universitario. Tu fin de semana empieza el jueves por la noche. ¡Disfrútalo!',
        'Lunes Relax': 'Te saltas el trauma del lunes. Tu semana arranca realmente el martes.'
    },
    rhythm: {
        'Reloj Suizo': 'Eres una máquina de hábitos. Siempre entras a la misma hora, tu cuerpo te lo agradecerá.',
        'Alondra': 'Amas (o te obligan a amar) la mañana. Ves el sol salir en la universidad.',
        'Búho': 'Vives de tarde/noche. Las mañanas no existen para ti, ideal para evitar el frío matutino.',
        'Bifásico': 'Tu horario está roto: unos días madrugas, otros trasnochas. Tu ciclo de sueño pide auxilio.',
        'Caótico': 'Sin patrón alguno. Cada día es una sorpresa para tu reloj biológico.',
        'Escalador': 'Empiezas la semana madrugando, pero cada día se te pegan más las sábanas.',
        'Despertar': 'El lunes entras tarde, pero te vas ajustando para madrugar hacia el final de la semana.'
    }
};

const PRETRAINED_DISTRIBUTION = { "wIH": [[-1.2406357183778438, -1.5736705857722695, -0.7824931938789468, 0.4395958158363905, 3.4213697330917423], [0.49473186676218756, 2.0623039658794924, 2.101607627689654, -0.7949715252374359, -3.2061187719883315], [2.786580954226119, 0.7163121472924292, -1.3510212311649366, -2.470134498729834, 1.6474217270955054], [-3.285211012263504, 0.7095933909431665, -2.0744740601146807, 2.2764486229821426, 2.2366801589246106], [-1.468088498701527, 3.404949866386685, 1.8330362434583372, 0.7162403587453838, -2.647938588029227], [0.4885588574010828, -0.16682860669721056, 0.8453967192025875, 1.4925500624017025, 0.5468833047650516], [-0.46271715414807907, 0.1364886128228598, 0.1937658906367787, -0.6538999377635362, 2.1076987162799132], [-0.4272129489294807, -0.08576065634008224, -1.2724957107241888, -0.28610697384376294, -0.48564311117499]], "wHO": [[-0.6326775801308926, 0.6092910884505414, 0.1703394290093287, 0.5366817002722138, -0.9651251792945104, -0.6278465894114628, -0.8476371580780268, -0.27443092914476314], [-0.6699842789110413, 0.8581615323984845, 0.29932423113752143, -1.7603630951106823, 0.6456170970309271, -1.4397356881295789, 0.004052718460021948, 0.10406423680549125], [1.2309990923198582, -1.533338027032957, -1.5756942379304844, 0.5920991849449843, -1.1863187319968027, 0.2239776154761767, 0.3127485945040347, 0.7125103298634297], [-0.6913948303100169, 0.9403106107123611, -1.8646064922442975, -0.23897630875040293, 0.4494337434523622, -0.056063601637282544, -0.21032049380974394, 0.8084014638743289], [0.7582616904109628, -1.2349317391586283, 0.43772485987478865, 0.40584831170516117, -2.076611140954278, -0.9571302236732557, -0.31471809224907416, 0.23595528553155354], [0.3135894414914616, -0.09484095035780431, 0.9602294934422617, -1.6621113961313312, -1.486418767807347, -0.49774077260250826, 0.05234008255883849, -0.688073638583328], [-1.255332280896348, 1.0665135683533824, -1.3118321719476198, -0.6617427611205488, 0.08899490421582909, 0.10762954314450222, -1.2590555407547261, 0.3330587560719722], [0.41497577491208426, -0.18798889130478047, -0.8176805244947618, 1.1651567622016483, 0.9458678410835871, -1.2722251793762709, 0.14165113847513844, -1.180494844481244]], "bH": [-0.48756934286907, 0.39827651077298165, 0.20691175871677056, 1.2676770701371267, -0.24365614560189097, 1.9484314044501627, 0.42935024312250486, -0.3210324256569924], "bO": [-0.3982742208256358, -0.21620107371588226, -0.7244092502989572, -1.0171855435695454, -0.003759037603261518, 0.026599716875614528, -0.26000886196420003, -1.3483850780631952] };
const PRETRAINED_RHYTHM = { "wIH": [[0.7998280071989604, 2.2051061028496033, -1.2859911424701893, -1.1319630446496356, -2.9818176874085065], [-3.109450203587189, -1.980087398228535, -1.3952755380368567, -0.03962591840609532, 1.8030308649459155], [0.1480807737012269, -2.5803663127062233, 0.739124392242765, -1.073038937022238, 2.1780030924850324], [1.6358888362713973, -0.16393218839292145, -0.6545477126903277, -2.892337896845062, -2.256361276635923], [1.2958428528817052, 1.3966721331657432, 0.6588222689114237, 1.2834916546756756, 1.0990183614082578], [-0.6200429905030537, 0.8691399416089177, -0.21295629806938285, 0.900854051447742, 0.24521882040022216], [-1.0422891842725615, 0.5716528206717365, -1.1990904082407294, -0.1711536331169695, -1.2497228648876466], [2.0157469228332587, 1.362588618649834, 0.7781955528181835, 2.131460422869976, 0.3718396748222583]], "wHO": [[-0.9864212456682618, 0.346598488046843, 0.5705353441386894, 0.489325644058944, 0.09052496170761049, -1.2317842377121566, 0.0725174154814191, 0.17864767367495935], [1.0608807620723346, 1.2731556136074345, 0.5995074920367881, 0.6022959619825066, -1.4819156610475808, -0.7209418310835645, 0.7455647506916946, -2.052169331075731], [0.12216904017979224, -1.1390901909576228, 0.5406010825156189, -1.2275980588341244, -0.6270048672433244, -0.8363021084759334, -0.2863060677994351, 1.0788398283676508], [1.1615439680283384, 0.28048136383568983, -1.5449623022253036, -0.6102927388017209, -0.5554501816049637, 0.33950317328554236, 0.5688866443745911, 0.4641270193205686], [-0.13527242941887926, -0.48836285825633874, 0.610533542347292, -0.22270412843604426, 0.29387374882411976, -1.2631289345298988, -0.7098271357611338, -0.014769779073864366], [-1.7470918581385366, 1.7391646912108734, 0.32790218888652684, -1.212392070672354, -0.2210268190548819, 0.323811592062425, 0.06301438538551947, -0.2420489036699815], [1.3028022723181105, -0.757756811465742, -1.1304397914676683, 1.318440077022717, -1.0982678786496307, -1.0340795534682912, 0.05556832561581773, 0.5221742380846424]], "bH": [0.35940046243679274, 1.4409516585907842, 1.7089353941492835, 1.7450527606172925, 1.5160653574974874, 2.265147776691767, -0.7636288951300003, -1.7481520559760098], "bO": [-1.173676082804579, 0.05158647347816437, -0.25972112123439495, -0.9399346613784575, -1.0116818734721602, -1.1196011157581511, -0.14693362427920142] };

// Instancias globales
let distNN: NeuralNetwork;
let rhythmNN: NeuralNetwork;

// --- Generación de Datos Sintéticos (Arquetipos) ---
function generateTrainingData() {
    const trainingSetDist = [];
    const trainingSetRhythm = [];

    // Generamos ruido aleatorio para que la IA generalice
    const noise = () => (Math.random() - 0.5) * 0.2;

    for (let i = 0; i < 1000; i++) {
        // --- DISTRIBUCIÓN (Inputs: Carga normalizada L-V) ---
        // Equilibrada [0.5, 0.5, 0.5, 0.5, 0.5]
        trainingSetDist.push({
            in: [0.5 + noise(), 0.5 + noise(), 0.5 + noise(), 0.5 + noise(), 0.5 + noise()],
            out: [1, 0, 0, 0, 0, 0, 0, 0]
        });
        // Cuesta Abajo [0.9, 0.7, 0.5, 0.3, 0.1]
        trainingSetDist.push({
            in: [0.9 + noise(), 0.7 + noise(), 0.4 + noise(), 0.2 + noise(), 0.1 + noise()],
            out: [0, 1, 0, 0, 0, 0, 0, 0]
        });
        // Cuesta Arriba [0.1, 0.3, 0.5, 0.7, 0.9]
        trainingSetDist.push({
            in: [0.1 + noise(), 0.2 + noise(), 0.4 + noise(), 0.8 + noise(), 0.9 + noise()],
            out: [0, 0, 1, 0, 0, 0, 0, 0]
        });
        // Pirámide [0.2, 0.5, 0.9, 0.5, 0.2]
        trainingSetDist.push({
            in: [0.2 + noise(), 0.5 + noise(), 0.9 + noise(), 0.5 + noise(), 0.2 + noise()],
            out: [0, 0, 0, 1, 0, 0, 0, 0]
        });
        // Valle [0.9, 0.4, 0.1, 0.4, 0.9]
        trainingSetDist.push({
            in: [0.9 + noise(), 0.3 + noise(), 0.1 + noise(), 0.3 + noise(), 0.9 + noise()],
            out: [0, 0, 0, 0, 1, 0, 0, 0]
        });
        // Montaña Rusa [0.9, 0.1, 0.9, 0.1, 0.9]
        trainingSetDist.push({
            in: [0.9 + noise(), 0.1 + noise(), 0.9 + noise(), 0.1 + noise(), 0.8 + noise()],
            out: [0, 0, 0, 0, 0, 1, 0, 0]
        });

        // Viernes Libre (6): Carga Lun-Jue, 0 Viernes
        trainingSetDist.push({
            in: [0.8 + noise(), 0.8 + noise(), 0.8 + noise(), 0.8 + noise(), 0.0 + Math.abs(noise())],
            out: [0, 0, 0, 0, 0, 0, 1, 0]
        });

        // Lunes Relax (7): 0 Lunes, Carga Mar-Vie
        trainingSetDist.push({
            in: [0.0 + Math.abs(noise()), 0.8 + noise(), 0.8 + noise(), 0.8 + noise(), 0.8 + noise()],
            out: [0, 0, 0, 0, 0, 0, 0, 1]
        });

        // --- RITMO (Inputs: Hora inicio normalizada 0-1) ---
        // 0 = 8:00 AM (Bloque 1), 1 = 19:00 PM (Bloque 12)

        // Reloj Suizo (Siempre a la misma hora, ej media)
        const base = Math.random();
        trainingSetRhythm.push({
            in: [base + noise() * 0.1, base + noise() * 0.1, base + noise() * 0.1, base + noise() * 0.1, base + noise() * 0.1],
            out: [1, 0, 0, 0, 0, 0, 0]
        });
        // Alondra (Siempre temprano < 0.3)
        trainingSetRhythm.push({
            in: [0.1 + noise(), 0.2 + noise(), 0.1 + noise(), 0.0 + noise(), 0.2 + noise()],
            out: [0, 1, 0, 0, 0, 0, 0]
        });
        // Búho (Siempre tarde > 0.6)
        trainingSetRhythm.push({
            in: [0.8 + noise(), 0.7 + noise(), 0.9 + noise(), 0.8 + noise(), 0.7 + noise()],
            out: [0, 0, 1, 0, 0, 0, 0]
        });
        // Bifásico (Temprano, Tarde, Temprano, Tarde...)
        trainingSetRhythm.push({
            in: [0.1 + noise(), 0.9 + noise(), 0.1 + noise(), 0.9 + noise(), 0.1 + noise()],
            out: [0, 0, 0, 1, 0, 0, 0]
        });
        // Caótico (Totalmente random)
        trainingSetRhythm.push({
            in: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
            out: [0, 0, 0, 0, 1, 0, 0]
        });
        // Escalador (5): 8am -> 10am -> 12pm... (Sube el valor de hora)
        trainingSetRhythm.push({
            in: [0.1 + noise(), 0.3 + noise(), 0.5 + noise(), 0.7 + noise(), 0.9 + noise()],
            out: [0, 0, 0, 0, 0, 1, 0]
        });

        // Despertar (6): 6pm -> 4pm -> ... -> 8am (Baja el valor de hora)
        trainingSetRhythm.push({
            in: [0.9 + noise(), 0.7 + noise(), 0.5 + noise(), 0.3 + noise(), 0.1 + noise()],
            out: [0, 0, 0, 0, 0, 0, 1]
        });
    }
    return { trainingSetDist, trainingSetRhythm };
}

export function initAI() {
    if (!browser) return;

    // Configuración: 5 inputs (días), 8 hidden, N salidas
    distNN = new NeuralNetwork(5, 8, DISTRIBUTION_LABELS.length);
    rhythmNN = new NeuralNetwork(5, 8, RHYTHM_LABELS.length);

    if (import.meta.env.DEV && !PRETRAINED_DISTRIBUTION) {
        console.log('🧠 [AI] Entrenando redes neuronales en el cliente...');
        const data = generateTrainingData();

        // Entrenar Distribución
        for (let i = 0; i < 2000; i++) {
            const sample = data.trainingSetDist[Math.floor(Math.random() * data.trainingSetDist.length)];
            distNN.train(sample.in, sample.out);
        }
        console.log('🧠 [AI] Distribución Weights:', JSON.stringify(distNN.toJSON()));

        // Entrenar Ritmo
        for (let i = 0; i < 2000; i++) {
            const sample = data.trainingSetRhythm[Math.floor(Math.random() * data.trainingSetRhythm.length)];
            rhythmNN.train(sample.in, sample.out);
        }
        console.log('🧠 [AI] Ritmo Weights:', JSON.stringify(rhythmNN.toJSON()));
    } else if (PRETRAINED_DISTRIBUTION) {
        distNN.fromJSON(PRETRAINED_DISTRIBUTION);
        rhythmNN.fromJSON(PRETRAINED_RHYTHM);
    }
}

export function classifySchedule(loads: number[], starts: number[]) {
    if (!distNN) initAI();

    const maxLoad = Math.max(...loads) || 1;
    const normLoads = loads.map(l => l / maxLoad);

    const distOut = distNN.predict(normLoads);
    const rhythmOut = rhythmNN.predict(starts);

    const distIndex = distOut.indexOf(Math.max(...distOut));
    const rhythmIndex = rhythmOut.indexOf(Math.max(...rhythmOut));

    const distLabel = DISTRIBUTION_LABELS[distIndex];
    const rhythmLabel = RHYTHM_LABELS[rhythmIndex];

    return {
        distribution: distLabel,
        distributionDescription: DESCRIPTIONS.distribution[distLabel], // Nueva propiedad
        rhythm: rhythmLabel,
        rhythmDescription: DESCRIPTIONS.rhythm[rhythmLabel], // Nueva propiedad
        distConfidence: distOut[distIndex],
        rhythmConfidence: rhythmOut[rhythmIndex]
    };
}