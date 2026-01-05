// src/lib/ai/classifier.ts
import { NeuralNetwork } from './mini-brain';
import { browser } from '$app/environment';

// --- Imports de Iconos ---
import TrendingUp from '$lib/icons/trending-up.svelte';
import TrendingDown from '$lib/icons/trending-down.svelte';
import Activity from '$lib/icons/activity.svelte';
import Paralelos from '$lib/icons/paralelos.svelte';
import Sun from '$lib/icons/sun.svelte';
import Moon from '$lib/icons/moon.svelte';
import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
import MaterialSymbolsTimeline from '$lib/icons/MaterialSymbolsTimeline.svelte';
import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';

// --- NUEVAS CATEGORÍAS BASADAS EN TENDENCIAS (SHAPES) ---

export const DISTRIBUTION_LABELS = [
    'Uniforme',        // Plana
    'Decreciente',      // Decreciente
    'Creciente',       // Creciente
    'Campana',         // Convexa (Pico al medio)
    'Valle',           // Cóncava (Descanso al medio)
    'Fragmentada'      // Irregular
] as const;

// Ritmo se mantiene igual, ya que describe hábitos horarios, no carga.
export const RHYTHM_LABELS = [
    'Reloj Suizo',
    'Matutino',
    'Búho',
    'Bifásico',
    'Caótico',
    'Escalador',
    'Despertar'
] as const;

// --- Mapeo de Iconos ---
const ICONS = {
    distribution: {
        'Uniforme': Paralelos,
        'Decreciente': TrendingDown, // Carga baja hacia el final
        'Creciente': TrendingUp,    // Carga sube hacia el final
        'Campana': MaterialSymbolsLocalFireDepartmentRounded, // Lo duro está al medio
        'Valle': MaterialSymbolsNestEcoLeaf, // El medio es relax (eco/green)
        'Fragmentada': Activity // Sismógrafo
    },
    rhythm: {
        'Reloj Suizo': MaterialSymbolsNestClockFarsightAnalogOutline,
        'Matutino': Sun,
        'Búho': Moon,
        'Bifásico': MaterialSymbolsTimeline, // Líneas separadas
        'Caótico': MaterialSymbolsDirectionsRun, // Corriendo de un lado a otro
        'Escalador': null, // No hay icono específico perfecto, mejor null (o default externo)
        'Despertar': null
    }
};

export const DESCRIPTIONS = {
    distribution: {
        'Uniforme': 'La carga académica presenta una distribución homogénea a lo largo de la semana, manteniendo una exigencia constante sin variaciones significativas entre días.',
        'Decreciente': 'La exigencia académica se concentra mayoritariamente al inicio de la semana, disminuyendo progresivamente hacia los días finales.',
        'Creciente': 'La intensidad de la carga es leve al comienzo del periodo semanal y aumenta gradualmente, concentrando la mayor exigencia en los últimos días.',
        'Campana': 'Los días de mayor actividad académica se sitúan en la mitad de la semana, dejando el inicio y el término de esta con una carga comparativamente menor.',
        'Valle': 'La carga se distribuye intensamente en los extremos de la semana, presentando una disminución notable de la actividad lectiva en los días centrales.',
        'Fragmentada': 'La distribución de la carga no sigue un patrón continuo, alternando días de alta exigencia con jornadas de baja actividad de manera irregular.'
    },
    rhythm: {
        'Reloj Suizo': 'El horario de inicio de clases se mantiene constante a lo largo de todos los días de la semana, favoreciendo la regularidad.',
        'Matutino': 'La actividad académica se concentra predominantemente en los bloques horarios de la mañana.',
        'Búho': 'La actividad académica se concentra predominantemente en los bloques horarios de la tarde o vespertinos.',
        'Bifásico': 'Los horarios de entrada presentan una polarización marcada, alternando entre inicios muy tempranos y tardíos sin tendencias intermedias.',
        'Caótico': 'No existe un patrón predecible en los horarios de inicio, variando significativamente y sin orden aparente de un día a otro.',
        'Escalador': 'Se observa una tendencia progresiva en el horario de entrada, comenzando temprano al inicio de la semana e iniciando más tarde cada día sucesivo.',
        'Despertar': 'Se observa una tendencia regresiva en el horario de entrada, comenzando tarde al inicio de la semana y requiriendo ingresos más tempranos hacia el final.'
    }
};

const PRETRAINED_DISTRIBUTION = { "weights": [[[3.4125769870343152, -0.9104252545491509, 0.08155826624787914, -3.6268550871964584, 2.5308183016345467, 1.9084925035418807, -0.4606623015425466], [-0.7215346506563434, -1.8746097171878866, -6.799662502046884, 0.33072279333914034, 4.866194910854393, -0.1004777717109333, 0.7494454064217828], [-2.434261298572561, -1.2966771232860987, 1.166154623983074, 1.8114189224015524, 3.1700818354948592, -1.1970387209274505, 0.4898143740336053], [-4.199226057029041, -1.4943670824516657, 4.039832322990776, 2.2993050113953943, 1.618956667571652, -0.6733697195684463, 0.468561856346157], [-0.05944290936112619, 1.4265092161808348, 3.0903425709139807, 0.07592888212549437, -3.383835881995949, 0.058499553743895184, 0.04170385107068479], [-0.14082008233127896, -2.110334777091481, -4.874276824076454, 1.6914510590520155, 4.337307868695111, -1.1273635152623493, 0.6604995452237141], [6.321183288625511, 2.5533081613644804, -4.140209251614261, -1.9999436847844883, -1.693251153415675, 0.1364763831379395, -0.65154750728183], [-4.864340310322918, -1.8682830434498159, 3.603889898725432, 3.454829670334141, 2.076269837359161, 0.5296772149900829, -0.49143855056372093], [2.664819896047104, 1.0838332052530943, 2.3614327763939094, -1.017243516110993, -3.3765114374480665, -1.5901231001181746, 0.8522786587809601], [0.14701274405186449, 2.822537162820934, 2.566046988849666, 0.7353756854071358, -6.120163772358874, 0.9870329043713875, 0.27573009716718583]], [[0.24995015672714643, -1.4582824903891394, -0.022395520423644722, 1.2053000646178464, 0.7657737630767574, -0.9616314085437043, -2.492570448249062, 1.772106296894665, -0.8275388111195559, -0.13900055767176175], [0.30138256802873037, -1.3709580759101638, 0.1614355958921066, 1.301501003982906, 0.2206270967944708, 0.5497991110890398, -0.2537675077781232, 1.9631930891791831, -0.558547597971618, 0.6572941412815054], [1.3095091419523315, 2.271237533368771, -0.7382384457541301, -0.9820107116379075, -0.6195978337283106, 1.2193400495523556, 1.3931883845099864, -0.6394471778355635, -0.09509458668544071, -1.26842460937889], [-1.1745309700291435, 0.699222993728271, 0.5104006795123703, 1.3528560673445822, -0.13473809833675893, -0.15651701263531292, -1.9796970995632863, 1.3429575654558787, -0.04209216430954444, -1.3681852281376767], [1.4416637932185579, 1.2017392670445712, 0.2825320671338351, -0.24864570769656327, 0.8437460726238742, -0.14300090648860375, -1.1274301879808368, -0.5957552049772754, -0.41352664758267904, 0.8173721301719222], [0.568070907870384, -1.8234563138259139, -0.7784881155486614, -0.2994836458397133, 1.3102965957519326, -1.4966839013230908, 1.3560970417961529, -1.1414964626383257, 1.465876866793584, 1.694408740160027], [-0.0013452368340761823, -2.539851054158314, -0.6073622213398748, -0.5519979187064208, 0.19454920994909938, -2.007655151112636, -0.9841461128749635, -1.6823668649139, 1.9549702079257454, 1.563722997120494], [-0.9623600825300126, -0.386928107102085, 1.0704494614768516, 1.2529136432043337, -0.25022346343294105, 1.5497031147516769, 0.6263379315726069, 1.247720279600238, 0.7110891030030257, -0.8960207027057813]], [[0.03510311057755835, 0.13167962638505906, -0.32313122146829526, -0.6991577079232165, -0.15661373467510584, 0.7384696811790604, -1.033885667739594, -1.0467475120786625], [-0.11360106228345505, -0.9736775961262099, -0.17563608959289806, -1.242195068223446, -0.11560638836090992, 1.5362165241011463, 1.8361799844973967, -1.2496179947909116], [0.7774604233601972, 0.689863251407622, 0.44790712983185527, 1.336503981198842, -0.017227283121716074, -2.3077148645267793, -0.8767373008220034, -0.9619666629744147], [1.7268991455218325, -0.8353599826237492, -2.387821345990922, 0.3335512679598757, -0.2749228180744108, 0.09595470651228583, 0.4824218047421638, 0.16869558063488518], [-1.8003796655054196, -1.2938887492413942, 1.2771029739618687, -0.38795065287268776, -0.09024644666326936, -0.48759573964150027, -1.4604741588244514, -0.28168116168760293], [0.12790574533259605, -0.9903176168228282, -0.9343466471003662, -0.1673307830756988, -1.299749403106187, 0.2966939954382033, -0.8174089255154969, 0.652516534045012]]], "biases": [[1.3054427458063127, 1.128008032743203, -0.33091930956272164, -0.4632436758573216, 0.04442636632621525, 0.9479220499539514, 1.0322825374121705, -0.018800216923488898, -0.36517231147455215, 0.9783504561991837], [1.08158971653242, 0.17773022237048194, 0.3416945844568044, 0.2753927528406852, 0.2603240031877576, 0.9356618724281462, 0.4832467090394674, -0.0660157555263298], [-0.1595256716973852, -0.800150479814937, -0.6748885853684906, -0.6208274136143495, 0.44685183509453635, 0.29966826032568594]] };
const PRETRAINED_RHYTHM = { "weights": [[[6.456700058534943, 1.616504449024686, 3.4095861017920663, -1.5117369993742673, 0.5287790579787418, -0.5515046783716572, -1.709940777443615], [0.7159157761455831, 1.0693794146726152, 0.17392663821348128, 1.8340355381311808, 0.9812702359867957, 1.540679964782302, 0.40537135061520796], [-4.019567237344806, 0.4499848839203015, -3.222555586989052, 1.1221983699953948, -0.9911887935260518, 0.9919395652787303, 1.5239779817647512], [0.7721342237233059, -0.7169944213082803, -0.16776847299772757, 0.0765750439822495, 0.701094764785138, 0.5395726515455295, 0.4208413281215658], [1.934548604036543, 0.5509002001031984, -0.20490741588300582, 1.0382382668926287, 0.23867436967845732, 0.530467284392958, 0.6449728906331902], [0.17970261515015482, 2.286010340251581, -2.4788277865921096, -1.078149265573106, -3.994925661492938, 1.1561157876647885, 1.409803066806943], [-4.180026435060869, -4.9903600930465855, -1.8354598206530717, -1.928504664787267, 0.8352980003842989, 0.9874354732771065, 1.6927920730536943], [4.862601388429252, -0.720132590556652, 3.4622679715685836, -3.4638143180582643, -2.3765491213685834, 0.6637672789635815, 0.7362374070989993], [-3.1305825640333227, -3.5497102526011384, 0.006624992240343522, -0.7671582866432566, 4.513745530692164, 0.4138262209279886, 1.304677137817168], [0.16710152677621398, 2.578785818389725, -3.640400419248035, -0.738800508087123, -6.663389385627049, 0.45655705338568425, 0.9007358825358559]], [[0.6326647273403805, 1.0367587780529661, -0.01725907765915425, 1.5508363296556875, 1.2231731646950754, 0.7789416653643899, 0.7304542528376124, 0.20377682979934286, -0.6559740470050133, 0.5378043979544015], [-1.3818016788286904, 0.6064167622854112, 1.2770242017808944, 0.6086747827042672, 0.4929825009975108, 0.45104649491792986, 0.6192184104820143, -0.9685389835202299, 0.41966551041964, 0.48601389311834287], [0.49776711833941745, 0.8735277047226973, 0.18864120151030708, 0.7526452415865138, 0.5168543697599334, -0.5809574380257838, -1.1865896319621683, -0.6080754695315389, 0.29110064461670443, -0.46253149813290456], [2.2703913650029066, -0.06313681679651746, -0.9799798426031745, 0.8280031809045578, 0.09969468326353548, -0.8582831926363343, 0.07280339916822044, 1.9139457227416503, -0.9113187555849946, -1.5029976927775188], [1.0577485538547065, 0.029663826380193395, 0.5787615276195037, -1.1380909958571197, -0.019939427911165142, 0.7615397863506294, -2.1699086800508334, -0.7204069187994953, -2.409351304229678, 2.288803939069068], [0.5618455861229399, -0.41730077756674777, -0.44201718645923066, 0.2693633915635461, 0.7671588865500207, -1.1469232370451288, 1.3479160674463337, 0.030341435737362997, 2.1455338348492456, -2.214760625334825], [0.9691937206255903, 0.7764972159267219, -0.1346298996973515, 0.7109110761595808, -0.19508860059532548, -1.5028018745086127, -0.5179401085721801, -1.9758596263273, 1.2361104315953906, -2.980752453712766], [2.394072600205951, 1.1045960250471414, -1.0087742013714305, -0.7102527227425055, 1.2390784378832955, 0.4117515394534082, -2.1956895781681287, 1.4443703602660265, -1.444222049119811, -0.801996858549616]], [[-0.38383255120428705, -1.014280178694026, 0.22341178661822766, 0.5516851492175788, -0.4450536802154023, 0.7616226383568181, -0.5575474830480006, -0.47305936118634195], [-0.21039011170389763, 0.5594637440568374, -0.8814502470592974, -0.6320953673978981, -0.931679322538051, -0.05770264555125702, -1.111638092974568, -1.6290686596264798], [-0.7696447469329565, -1.7389874660014362, -0.6826682488762703, 0.7264783929179616, -0.5352430033585546, 1.059660989242566, 0.5328737966511876, 1.1898330352880848], [-0.6034053471919332, 0.11841486841002104, 0.3574023515340037, -1.4721078249506294, 1.6345097623602598, -1.3626164928708167, -0.4518144414636077, -0.6968046658193663], [-1.3566838956741882, -1.3155373389471288, 0.7994072833249457, -0.7028201903784163, 0.44489449006444826, 0.16534345912829784, 0.520573574689454, 0.49774526946415343], [-1.0956812613652878, -0.1962109988479781, 0.10227909258917131, -0.1299512960175143, -1.4117083528211738, -0.2121414511696011, 1.6964744608255462, -1.5691148380056807], [-0.45282095116836896, -1.209751131929963, 0.15220755147635642, 1.2238152864196412, 1.4142617955450434, -1.3230857656905197, -1.3396151486356014, 0.8777436115458247]]], "biases": [[-2.6011604253182923, 0.6785904254807392, 1.2978151531572621, 3.5050921501240375, 2.2559411526010322, 0.9359397595086194, 2.895024765577918, 0.07916478080134476, 1.6771479463162877, 2.2903966955472668], [-0.12387501497153022, 0.29444607858619, -0.3674338337225534, -0.16752828111105322, 0.14431834654499226, 1.1121068257913973, 0.6258288456928056, -0.5720040344542917], [-0.9345461988103572, 0.5601307148891376, -0.9424315698933621, -0.17489144995165648, -0.3353027002051041, 0.14546788993473192, -1.0463934281088818]] };

let distNN: NeuralNetwork;
let rhythmNN: NeuralNetwork;

function generateTrainingData() {
    const trainingSetDist: { in: number[], out: number[] }[] = [];
    const trainingSetRhythm: { in: number[], out: number[] }[] = [];

    // Función de ruido controlada
    const noise = (val: number) => {
        const n = (Math.random() - 0.5) * 0.15;
        return Math.max(0, Math.min(1, val + n));
    };

    const createTarget = (index: number, total: number) => {
        const t = new Array(total).fill(0);
        t[index] = 1;
        return t;
    };

    const SAMPLES = 1500;

    for (let i = 0; i < SAMPLES; i++) {
        // ============================================================
        // --- DISTRIBUCIÓN (Topología de la Carga) ---
        // Inputs: 7 días (L-D). Analizamos la CURVA.
        // ============================================================
        const targetDist = (idx: number) => createTarget(idx, DISTRIBUTION_LABELS.length);

        // 0. Uniforme: ~~~~~~~
        // Entrenamos con y sin fin de semana para que detecte la "planicie"
        trainingSetDist.push({
            in: [0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.0].map(noise), // L-V
            out: targetDist(0)
        });
        trainingSetDist.push({
            in: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.0].map(noise), // L-S
            out: targetDist(0)
        });

        // 1. Front-Load (Decreciente): \_____
        // Mucha carga al inicio, poca o nada al final
        trainingSetDist.push({
            in: [1.0, 0.8, 0.5, 0.2, 0.0, 0.0, 0.0].map(noise),
            out: targetDist(1)
        });
        trainingSetDist.push({
            in: [0.9, 0.9, 0.6, 0.3, 0.1, 0.0, 0.0].map(noise),
            out: targetDist(1)
        });

        // 2. Back-Load (Creciente): _____/
        // Poca carga al inicio, explota al final
        trainingSetDist.push({
            in: [0.0, 0.2, 0.5, 0.8, 1.0, 0.0, 0.0].map(noise),
            out: targetDist(2)
        });
        trainingSetDist.push({
            in: [0.2, 0.2, 0.4, 0.7, 0.9, 0.3, 0.0].map(noise), // Incluye sábado cargado
            out: targetDist(2)
        });

        // 3. Campana (Convexa): __/ \__
        // Pico en el centro (Miércoles/Jueves)
        trainingSetDist.push({
            in: [0.2, 0.5, 1.0, 0.5, 0.2, 0.0, 0.0].map(noise),
            out: targetDist(3)
        });
        trainingSetDist.push({
            in: [0.1, 0.4, 0.9, 0.9, 0.4, 0.0, 0.0].map(noise),
            out: targetDist(3)
        });

        // 4. Valle (Cóncava): \__/
        // Altos extremos, bajo centro
        trainingSetDist.push({
            in: [1.0, 0.3, 0.1, 0.3, 1.0, 0.0, 0.0].map(noise),
            out: targetDist(4)
        });
        trainingSetDist.push({
            in: [0.8, 0.2, 0.2, 0.2, 0.8, 0.0, 0.0].map(noise),
            out: targetDist(4)
        });

        // 5. Fragmentada (Irregular): /\/\/\
        // Altos y bajos intercalados
        trainingSetDist.push({
            in: [1.0, 0.1, 1.0, 0.1, 1.0, 0.0, 0.0].map(noise),
            out: targetDist(5)
        });
        trainingSetDist.push({
            in: [0.2, 0.9, 0.2, 0.9, 0.2, 0.0, 0.0].map(noise),
            out: targetDist(5)
        });


        // ============================================================
        // --- RITMO (Patrones de Hora de Inicio) ---
        // Se mantiene la lógica anterior, funciona bien.
        // ============================================================
        const targetRhythm = (idx: number) => createTarget(idx, RHYTHM_LABELS.length);

        // Reloj Suizo
        const base = Math.random();
        trainingSetRhythm.push({
            in: [base, base, base, base, base, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(0)
        });
        // Matutino (< 0.3)
        trainingSetRhythm.push({
            in: [0.1, 0.2, 0.1, 0.15, 0.1, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(1)
        });
        // Búho (> 0.6)
        trainingSetRhythm.push({
            in: [0.8, 0.7, 0.9, 0.8, 0.7, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(2)
        });
        // Bifásico (Temprano/Tarde)
        trainingSetRhythm.push({
            in: [0.1, 0.9, 0.1, 0.9, 0.1, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(3)
        });
        // Caótico (Random)
        trainingSetRhythm.push({
            in: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), 0.5, 0.5],
            out: targetRhythm(4)
        });
        // Escalador (Sube)
        trainingSetRhythm.push({
            in: [0.1, 0.3, 0.5, 0.7, 0.9, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(5)
        });
        // Despertar (Baja)
        trainingSetRhythm.push({
            in: [0.9, 0.7, 0.5, 0.3, 0.1, 0.5, 0.5].map(v => v === 0.5 ? 0.5 : noise(v)),
            out: targetRhythm(6)
        });
    }

    return { trainingSetDist, trainingSetRhythm };
}

export function initAI() {
    if (!browser) return;

    // Arquitectura: 7 Inputs -> 10 Hidden -> 8 Hidden -> N Outputs
    distNN = new NeuralNetwork([7, 10, 8, DISTRIBUTION_LABELS.length]);
    rhythmNN = new NeuralNetwork([7, 10, 8, RHYTHM_LABELS.length]);

    if (import.meta.env.DEV && !PRETRAINED_DISTRIBUTION) {
        console.log('🧠 [AI] Entrenando Clasificador Topológico...');
        const data = generateTrainingData();

        for (let i = 0; i < 2000; i++) {
            const sampleDist = data.trainingSetDist[Math.floor(Math.random() * data.trainingSetDist.length)];
            distNN.train(sampleDist.in, sampleDist.out);

            const sampleRhythm = data.trainingSetRhythm[Math.floor(Math.random() * data.trainingSetRhythm.length)];
            rhythmNN.train(sampleRhythm.in, sampleRhythm.out);
        }

        console.log('🧠 [AI] Distribución Weights:', JSON.stringify(distNN.toJSON()));
        console.log('🧠 [AI] Ritmo Weights:', JSON.stringify(rhythmNN.toJSON()));

    } else if (PRETRAINED_DISTRIBUTION) {
        distNN.fromJSON(PRETRAINED_DISTRIBUTION);
        rhythmNN.fromJSON(PRETRAINED_RHYTHM);
    }
}

export function classifySchedule(loads: number[], starts: number[]) {
    if (!distNN) initAI();

    // Rellenar hasta 7 días
    const safeLoads = [...loads];
    while (safeLoads.length < 7) safeLoads.push(0);

    const safeStarts = [...starts];
    while (safeStarts.length < 7) safeStarts.push(0.5);

    // Normalizar
    const maxLoad = Math.max(...safeLoads) || 1;
    const normLoads = safeLoads.map(l => l / maxLoad);

    const distOut = distNN.predict(normLoads);
    const rhythmOut = rhythmNN.predict(safeStarts);

    const distIndex = distOut.indexOf(Math.max(...distOut));
    const rhythmIndex = rhythmOut.indexOf(Math.max(...rhythmOut));

    const distLabel = DISTRIBUTION_LABELS[distIndex];
    const rhythmLabel = RHYTHM_LABELS[rhythmIndex];

    return {
        distribution: distLabel,
        distributionDescription: DESCRIPTIONS.distribution[distLabel],
        distributionIcon: ICONS.distribution[distLabel] || null, // <--- Icono Opcional

        rhythm: rhythmLabel,
        rhythmDescription: DESCRIPTIONS.rhythm[rhythmLabel],
        rhythmIcon: ICONS.rhythm[rhythmLabel] || null,           // <--- Icono Opcional

        distConfidence: distOut[distIndex],
        rhythmConfidence: rhythmOut[rhythmIndex]
    };
}