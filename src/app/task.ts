import { Work } from "./work";

export interface Task {
    id: number,
    name: string,
    category: number,
    taskStart: Date,
    taskEnd: Date,
    active: boolean,
    status: number,
    timeWorking: number,
    lastStatus?: Date | null,
    work: Work[],
    color?: string; // Add color property
}
