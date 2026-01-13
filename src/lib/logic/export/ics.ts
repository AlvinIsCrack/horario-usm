// src/lib/helpers/ics.ts
import Time from '$lib/helpers/time';
import { Calendario } from '$lib/states/calendario.svelte';
import type { Ramo } from '../ramos/types';

// --- CONFIGURACIÓN ---
export interface ICSOptions {
    alarmEnabled?: boolean;
    alarmMinutes?: number;
    limitSemester?: boolean;
}

function escapeICS(str: string): string {
    return str.replace(/[\\,;]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
}

function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getNextDayOfWeek(dayIndex: number, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const resultDate = new Date();
    const targetDayJS = dayIndex + 1;
    const daysUntil = (targetDayJS + 7 - resultDate.getDay()) % 7;

    resultDate.setDate(resultDate.getDate() + daysUntil);
    resultDate.setHours(hours, minutes, 0, 0);

    if (resultDate < new Date()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
}

// Helper para calcular fin de semestre (aprox 18 semanas desde hoy)
function getSemesterEndDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + (18 * 7)); // +18 semanas
    return formatICSDate(d);
}

export function generateICS(options: ICSOptions): string {
    const ramos = Calendario.ramos;
    const now = formatICSDate(new Date());
    const generationId = new Date().getTime();

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Horario//USM//CL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `DTSTAMP:${now}`
    ];

    ramos.forEach((ramo: Ramo) => {
        ramo.horario.forEach(bloque => {
            const horaInicioStr = Time.bloqueToHHMM(bloque.bloque) || '08:00';
            const startDate = getNextDayOfWeek(bloque.dia, horaInicioStr);
            const endDate = new Date(startDate.getTime() + 70 * 60000);

            const summary = escapeICS(`${ramo.nombre} (${ramo.sigla})`);
            const location = escapeICS(bloque.sala || 'Por definir');
            const description = escapeICS(`Paralelo ${ramo.paralelo} - ${ramo.profesor.join(', ')}`);
            const uid = `${ramo.sigla}-${bloque.dia}-${bloque.bloque}-${generationId}@horario-usm`;

            // Lógica de Repetición
            let rrule = `RRULE:FREQ=WEEKLY;WKST=MO`;
            if (options.limitSemester) {
                // Si limitamos, agregamos UNTIL
                rrule += `;UNTIL=${getSemesterEndDate()}`;
            }

            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTART:${formatICSDate(startDate)}`,
                `DTEND:${formatICSDate(endDate)}`,
                rrule,
                `SUMMARY:${summary}`,
                `LOCATION:${location}`,
                `DESCRIPTION:${description}`
            );

            // Lógica de Alarma
            if (options.alarmEnabled && (options?.alarmMinutes || 15) > 0) {
                icsContent.push(
                    'BEGIN:VALARM',
                    `TRIGGER:-PT${options.alarmMinutes}M`,
                    'ACTION:DISPLAY',
                    `DESCRIPTION:Clase de ${summary}`,
                    'END:VALARM'
                );
            }

            icsContent.push('END:VEVENT');
        });
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
}

export function downloadICS(options: ICSOptions = {}) {
    const icsData = generateICS(options);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'horario_usm.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}