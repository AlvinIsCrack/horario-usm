import { fetchMallaData } from './data';
import type { RamoMalla } from './types';
import { Data } from '$lib/data/data.svelte';
import { Config } from '../config/store.svelte';

/**
 * Represents the state management for a student's academic curriculum (Malla).
 * Handles progress tracking, prerequisite validation, and persistence.
 */
export class MallaState {
    // --- Reactive States ---
    _selectedSede = $state<string>('');
    _selectedJornada = $state<string>('');
    selectedPlanId = $state<string>('');
    approvedSigs = $state<Set<string>>(new Set());
    customNames = $state<Record<string, string>>({});
    hoverSig = $state<string | null>(null);

    get selectedSede() { return this._selectedSede; }
    set selectedSede(value: string) {
        if (this._selectedSede === value) return;
        this._selectedSede = value;
        this.selectedPlanId = '';
        this.validateJornada();
    }

    get selectedJornada() { return this._selectedJornada; }
    set selectedJornada(value: string) {
        if (this._selectedJornada === value) return;
        this._selectedJornada = value;
        this.selectedPlanId = '';
    }

    // --- Derived States ---

    /** Raw curriculum structure retrieved from data sources based on selected plan. */
    rawMalla = $derived(fetchMallaData(this.selectedPlanId));

    /** Processed curriculum tracking blocking states and interactive relationships. */
    currentMalla = $derived.by(() => {
        if (!this.rawMalla.length) return [];
        const existingSiglas = new Set(this.rawMalla.flat().map((r) => r.sigla));

        return this.rawMalla.map((semester, semesterIndex) => {
            return semester.map((ramo) => {
                const isChecked = this.approvedSigs.has(ramo.sigla);

                // --- Lock Logic Evaluation ---
                let isLocked = false;
                if (!isChecked && ramo.requisitos.length > 0) {
                    // Evaluate whether the course is unlocked by inspecting its requirement groups.
                    // Each requirement group represents an alternate path to satisfy prerequisites.
                    // Co-requisites are ignored for unlocking purposes and requirements not present
                    // in the current curriculum are excluded to avoid false blocking states.
                    // A group with no strict prerequisites is considered to unlock the course by default.
                    // Otherwise the course is unlocked only when every valid prerequisite in a group
                    // has been approved by the student.
                    const isUnlocked = ramo.requisitos.some((grupoAnd) => {
                        const validPrereqs = grupoAnd.filter((r) =>
                            r &&
                            r.sigla &&
                            r.tipo !== 'CO' &&
                            existingSiglas.has(r.sigla)
                        );

                        if (validPrereqs.length === 0) return true;

                        return validPrereqs.every((reqObj) => this.approvedSigs.has(reqObj.sigla));
                    });

                    isLocked = !isUnlocked;
                }

                // --- Hover Relationship Analysis ---
                let isDep = false;
                let isPre = false;
                let isCo = false;
                let isUnlock = false;

                if (this.hoverSig) {
                    const hoverRamo = this.findRamo(this.hoverSig);

                    // Backward checks: Is current course a prerequisite of the hovered course?
                    if (hoverRamo) {
                        const reqEncontrado = hoverRamo.requisitos.flat().find((r) => r.sigla === ramo.sigla);
                        if (reqEncontrado) {
                            if (reqEncontrado.tipo === 'CO') isCo = true;
                            else isPre = true;
                        }
                    }

                    // Forward checks: Is hovered course a requirement for the current course?
                    const forwardReq = ramo.requisitos.flat().find((r) => r.sigla === this.hoverSig);
                    if (forwardReq) {
                        if (forwardReq.tipo === 'CO') {
                            isCo = true;
                        } else {
                            isDep = true;
                        }

                        // Verifies if approving the hovered course fully unlocks this course
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

    constructor() {
        // Hydrate state from localStorage synchronously during instantiation
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
                    console.error('Error loading state from localStorage:', e);
                    this._selectedSede = Config.sede;
                    this._selectedJornada = Config.jornada;
                }
            } else {
                this._selectedSede = Config.sede;
                this._selectedJornada = Config.jornada;
            }
        }

        // Declarative reactive synchronization effect for automated persistence
        $effect(() => {
            const statePayload = {
                planId: this.selectedPlanId,
                approved: Array.from(this.approvedSigs),
                customNames: this.customNames,
                sede: this._selectedSede,
                jornada: this._selectedJornada
            };
            localStorage.setItem('malla_progress', JSON.stringify(statePayload));
        });
    }

    /**
     * Validates and normalizes selected shift availability based on the campus configuration ruleset.
     */
    validateJornada() {
        const campusShifts = Data.jornadasCarreras[this._selectedSede];
        if (this._selectedSede && campusShifts && !campusShifts.includes(this._selectedJornada)) {
            this._selectedJornada = campusShifts[0] || '';
        }
    }

    /**
     * Finds a specific course configuration within the curriculum matrix.
     */
    findRamo(sigla: string): RamoMalla | null {
        return this.rawMalla.flat().find((r) => r.sigla === sigla) || null;
    }

    /**
     * Toggles the approval state of a course.
     */
    toggleRamo(sigla: string) {
        if (this.approvedSigs.has(sigla)) {
            this.approvedSigs.delete(sigla);
        } else {
            this.approvedSigs.add(sigla);
        }
        this.approvedSigs = new Set(this.approvedSigs);
    }

    /**
     * Assigns a custom local alias or name override to a specific course code.
     */
    setCustomName(sigla: string, name: string) {
        this.customNames[sigla] = name;
    }
}