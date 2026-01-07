import { onMount } from 'svelte';
import { fetchMallaData } from './data';
import type { Malla, RamoMalla } from './types';

export class MallaState {
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
        const isSiglaCode = /^[A-Z]{1,4}\d{1,5}(?:[A-Z]|[-_][A-Z0-9]+)?/;

        return this.rawMalla.map((semestre) => {
            return semestre.map((ramo) => {
                const isChecked = this.approvedSigs.has(ramo.sigla);

                // --- Lógica de Bloqueo ---
                let isLocked = false;
                if (!isChecked && ramo.requisitos.length > 0) {
                    const isUnlocked = ramo.requisitos.some((grupoAnd) => {
                        const validReqs = grupoAnd.filter((r) => r && r.sigla);
                        if (validReqs.length === 0) return true;

                        return validReqs.every((reqObj) => {
                            if (reqObj.tipo === 'CO') return true; // Co-requisitos no bloquean
                            const reqSigla = reqObj.sigla;
                            if (this.approvedSigs.has(reqSigla)) return true;
                            if (!existingSiglas.has(reqSigla)) return !isSiglaCode.test(reqSigla); // Externos
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
                                // @ts-ignore
                                if (!existingSiglas.has(req.sigla)) return !isSiglaCode.test(req.sigla);
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
        onMount(() => {
            const saved = localStorage.getItem('malla_progress');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.selectedPlanId = data.planId || '';
                    this.approvedSigs = new Set(data.approved || []);
                    this.customNames = data.customNames || {};
                } catch (e) {
                    console.error('Error loading state', e);
                }
            }
        });
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