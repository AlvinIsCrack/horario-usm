import { fetchMallaData } from './data';
import type { Malla, RamoMalla } from './types';
import { Calendario } from '$lib/states/calendario.svelte';
import { Data } from '$lib/data/data.svelte';
import { Config } from '../config/store.svelte';

export class MallaState {
    _selectedSede = $state<string>('');
    _selectedJornada = $state<string>('');

    // Getters y Setters para Sede y Jornada
    get selectedSede() { return this._selectedSede; }
    set selectedSede(value: string) {
        if (this._selectedSede === value) return;
        this._selectedSede = value;
        // Al cambiar sede, reseteamos plan y validamos jornada
        this.selectedPlanId = '';
        this.validateJornada();
    }

    get selectedJornada() { return this._selectedJornada; }
    set selectedJornada(value: string) {
        if (this._selectedJornada === value) return;
        this._selectedJornada = value;
        // Al cambiar jornada, reseteamos plan
        this.selectedPlanId = '';
    }

    selectedPlanId = $state<string>('');
    approvedSigs = $state<Set<string>>(new Set());
    customNames = $state<Record<string, string>>({});
    hoverSig = $state<string | null>(null);

    // Datos crudos
    rawMalla = $derived(fetchMallaData(this.selectedPlanId));

    // Malla procesada con lógica de bloqueos y relaciones
    currentMalla = $derived.by(() => {
        if (!this.rawMalla.length) return [];
        const existingSiglas = new Set(this.rawMalla.flat().map((r) => r.sigla));

        return this.rawMalla.map((semestre) => {
            return semestre.map((ramo) => {
                const isChecked = this.approvedSigs.has(ramo.sigla);

                // --- Lógica de Bloqueo ---
                let isLocked = false;
                if (!isChecked && ramo.requisitos.length > 0) {
                    const isUnlocked = ramo.requisitos.some((grupoAnd) => {
                        const validReqs = grupoAnd.filter((r) => r && r.sigla);
                        if (validReqs.some(r => !existingSiglas.has(r.sigla))) return false;
                        if (validReqs.length === 0) return true;

                        return validReqs.every((reqObj) => {
                            if (reqObj.tipo === 'CO') return true;
                            const reqSigla = reqObj.sigla;
                            if (this.approvedSigs.has(reqSigla)) return true;
                            return false;
                        });
                    });
                    isLocked = !isUnlocked;
                }

                // --- Lógica de Relaciones (Hover) ---
                let isDep = false;
                let isPre = false;
                let isCo = false;
                let isUnlock = false;

                if (this.hoverSig) {
                    const hoverRamo = this.findRamo(this.hoverSig);
                    // 1. Backward: ¿Es este ramo un requisito del Hover?
                    if (hoverRamo) {
                        const reqEncontrado = hoverRamo.requisitos.flat().find((r) => r.sigla === ramo.sigla);
                        if (reqEncontrado) {
                            if (reqEncontrado.tipo === 'CO') isCo = true;
                            else isPre = true;
                        }
                    }

                    // 2. Forward: ¿Es el Hover un requisito de este ramo? (Dependencia)
                    const forwardReq = ramo.requisitos.flat().find((r) => r.sigla === this.hoverSig);

                    if (forwardReq) {
                        // Si es Co-requisito, marcamos isCo (Cyan) en lugar de isDep (Verde)
                        if (forwardReq.tipo === 'CO') {
                            isCo = true;
                        } else {
                            isDep = true;
                        }

                        // LÓGICA DE DESBLOQUEO TOTAL
                        isUnlock = ramo.requisitos.some((grupoAnd) => {
                            if (!grupoAnd.some((r) => r.sigla === this.hoverSig)) return false;
                            return grupoAnd.every((req) => {
                                if (req.tipo === 'CO') return true;
                                if (req.sigla === this.hoverSig) return true;
                                if (this.approvedSigs.has(req.sigla)) return true;
                                if (!existingSiglas.has(req.sigla)) return true;
                                return false;
                            });
                        });
                    }
                }

                return {
                    ...ramo,
                    checked: isChecked,
                    locked: isLocked,
                    isDependency: isDep,
                    isPreRequisite: isPre,
                    isCoRequisite: isCo,
                    isUnlock: isUnlock
                };
            });
        });
    });

    // Estadísticas
    stats = $derived.by(() => {
        const todos = this.currentMalla.flat();
        if (todos.length === 0) return { percent: 0, total: 0, approved: 0, creditos: 0 };
        const aprobados = todos.filter((r) => r.checked);
        const creditosAprobados = aprobados.reduce((acc, r) => acc + r.creditos, 0);
        return {
            percent: Math.round((aprobados.length / todos.length) * 100),
            total: todos.length,
            approved: aprobados.length,
            creditos: creditosAprobados
        };
    });

    constructor() {
        // 1. Cargar Estado (Síncrono si es posible, o en onMount)
        // Usamos variables privadas (_) para NO activar los setters y borrar el planId
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('malla_progress');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this._selectedSede = data.sede || Config.sede;
                    this._selectedJornada = data.jornada || Config.jornada;
                    this.selectedPlanId = data.planId || '';
                    this.approvedSigs = new Set(data.approved || []);
                    this.customNames = data.customNames || {};
                } catch (e) {
                    console.error('Error loading state', e);
                    this._selectedSede = Config.sede;
                    this._selectedJornada = Config.jornada;
                }
            } else {
                this._selectedSede = Config.sede;
                this._selectedJornada = Config.jornada;
            }
        }

        // 2. Auto-guardado Reactivo (Svelte 5 Effect en constructor vincula al componente)
        $effect(() => {
            const data = {
                planId: this.selectedPlanId,
                approved: Array.from(this.approvedSigs),
                customNames: this.customNames,
                sede: this._selectedSede,
                jornada: this._selectedJornada
            };
            localStorage.setItem('malla_progress', JSON.stringify(data));
        });
    }

    validateJornada() {
        if (
            this._selectedSede &&
            Data.jornadasCarreras[this._selectedSede] &&
            !Data.jornadasCarreras[this._selectedSede].includes(this._selectedJornada)
        ) {
            this._selectedJornada = Data.jornadasCarreras[this._selectedSede][0] || '';
        }
    }

    findRamo(sigla: string): RamoMalla | null {
        return this.rawMalla.flat().find((r) => r.sigla === sigla) || null;
    }

    toggleRamo(sigla: string) {
        if (this.approvedSigs.has(sigla)) this.approvedSigs.delete(sigla);
        else this.approvedSigs.add(sigla);
        this.approvedSigs = new Set(this.approvedSigs); // Trigger reactivity
        this.save();
    }

    setCustomName(sigla: string, name: string) {
        this.customNames[sigla] = name;
        this.save();
    }

    save() {
        localStorage.setItem('malla_progress', JSON.stringify({
            planId: this.selectedPlanId,
            approved: Array.from(this.approvedSigs),
            customNames: this.customNames
        }));
    }
}