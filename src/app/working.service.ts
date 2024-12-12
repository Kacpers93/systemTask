import { Injectable } from '@angular/core';
import { Status } from './status';
import { Task } from './task';
import { Category } from './category';
import { BehaviorSubject, Observable } from 'rxjs';
import { Work } from './work';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class WorkingService {
  static lastID: number = 0;

  public static workStatusNew: number = 0;
  public static workStatusStart: number = 250;
  public static workStatusStop: number = 500;
  
  public static taskStatus: Status[] = [
    { id: WorkingService.workStatusNew, name: 'Do wykonania' },
    { id: WorkingService.workStatusStart, name: 'W trakcie' },
    { id: WorkingService.workStatusStop, name: 'Wykonane' },
  ];

  public static workStatus: Status[] = [
    { id: WorkingService.workStatusStart, name: 'Do trakcie' },
    { id: WorkingService.workStatusStop, name: 'Wykonane' },
  ];

  static getEmptyCategory(): Category {
    return {id: -1, name: ""};
  }

  static getBasicCategory(): Category {
    return {id: 0, name: "Brak"};
  }

  static getEmptyTask(): Task {
    return {id: -1, active: false, name: "", status: 0, taskEnd: new Date(), taskStart: new Date(), work:[], timeWorking: 0, category: -1};
  }

  static workSelectStatus(id: number): Status {
    return WorkingService.workStatus.filter(e => e.id == id)[0];
  }

  static getEmptyWork(): Work {
    return {start: new Date(), stop: new Date(), status: WorkingService.workSelectStatus(this.workStatusStart)};
  }


  private tasks: Task[] = [];
  private categories: Category[] = [{id: 0, name: "Brak"}];

  private rxdataTask: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>(
    this.tasks
  );

  private rxdataCategory: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(
    this.categories
  );

  public taskStatusStart(): Task | null {
    let workTask = this.tasks.filter(e => e.status == WorkingService.workStatusStart)[0];
    return workTask;
  }

  public subTask(): Observable<Task[]> {
    return this.rxdataTask.asObservable();
  }

  public subCategory(): Observable<Category[]> {
    return this.rxdataCategory.asObservable();
  }

  public refresh(): void {
    this.rxdataTask.next(this.tasks);
    this.rxdataCategory.next(this.categories);
  }

  getCategories(): Category[] {
    return this.categories;
  }

  getTask(id: number): Task {
    let indexTask = this.tasks.findIndex((e) => e.id == id);

    if (indexTask >= 0) return this.tasks[indexTask];
    let newTask = WorkingService.getEmptyTask();
    newTask.active = true;
    return newTask;
  }

  getCategory(id: number): Category {
    let index = this.categories.findIndex((e) => e.id == id);
    if (index >= 0) return this.categories[index];
    return WorkingService.getEmptyCategory();
  }

  public static getWorkTime(task: Task): string {
    let workTime = 0;
    if(task.status == WorkingService.workStatusStart){
      let work: Work | undefined = task.work.at(-1);
      workTime = (new Date()).getTime() - (new Date(work?.start??(new Date).getTime())).getTime();
    }
    let sumTime = task.timeWorking;
    if(!sumTime){
      sumTime = 0;
    }
    sumTime += workTime;

    let duration = moment.duration(sumTime);
    const day = duration.days();
    const hour = duration.hours().toString().padStart(2, "0");
    const minute = duration.minutes().toString().padStart(2, "0");
    const second = duration.seconds().toString().padStart(2, "0");
    if(day > 0){
      return `${day}:${hour}:${minute}:${second}`;
    }
    return `${hour}:${minute}:${second}`;
    
  }

  public addOrUpdate(task: Task): void {
    if (task.id < 0) {
      this.tasks.push(task);
      task.id = ++WorkingService.lastID;
    } else {
      let ind = this.tasks.findIndex((e) => (e.id == task.id));
      if (ind >= 0) {
        this.tasks[ind] = task;
      }
    }
    this.save();
    this.refresh();
  }

  public addOrUpdateCategory(category: Category): void {
    if (category.id < 0) {
      category.id = this.categories.length;
      this.categories.push(category);
    } else {
      let index = this.categories.findIndex((e) => (e.id == category.id));
      if (index >= 0) {
        this.categories[index] = category;
      }
    }

    this.save();
    this.refresh();
  }

  save(): void {
    let data = [this.tasks, this.categories];
    localStorage.setItem('sem3_apl_int', JSON.stringify(data));
  }

  load(): void {
    let dane = localStorage.getItem('sem3_apl_int');
    if (!dane) {dane = '[[],[]]'}
    else this.categories = JSON.parse(dane)[1] as Category[];
    
    this.tasks = JSON.parse(dane)[0] as Task[];
    this.tasks.forEach((e) => {
      e.taskStart = new Date(e.taskStart);
      e.taskEnd = new Date(e.taskEnd);
    });

    if (this.tasks.length)
      WorkingService.lastID = Math.max(...this.tasks.map((e) => e.id));
    this.refresh();
  }

  public remTask(id: number): void {
    this.tasks = this.tasks.filter((e) => e.id != id);
    this.save();
    this.refresh();
  }

  public remCategory(id: number): void {
    this.categories = this.categories.filter((e) => e.id != id);
    this.save();
    this.refresh();
  }

  public updateWorkTime(task: Task) {
    let workList: Work[] = task.work.filter(e => e.status.id == WorkingService.workStatusStop);
    let sum = 0;
    workList.forEach(e => {
      sum += (new Date(e.stop).getTime() - new Date(e.start).getTime());
    });
    task.timeWorking = sum;
    console.log(workList);
    
    console.log(sum);
  }

  public lastTaskItem(): Task | undefined {
    let task = this.tasks.sort((a, b) => ((a.lastStatus??0) < (b.lastStatus??0)) ? 1 : -1);
    return task.at(-1); // sprawdzić czy jest źle
  }

  public statusChange(task: Task) {

    let work: Work | undefined = task.work.at(-1);

    if(work != undefined && work.status.id == WorkingService.workStatusStart) {
      work.status = WorkingService.workSelectStatus(WorkingService.workStatusStop);
      work.stop = new Date();
      task.status = WorkingService.workStatusStop
      this.updateWorkTime(task);
    } else {
      let activeTask = this.taskStatusStart();
      if(activeTask) {
        this.statusChange(activeTask);
      }
      work = WorkingService.getEmptyWork();
      task.work.push(work);
      task.status = WorkingService.workStatusStart;
      task.lastStatus = new Date();
    }
    
    this.addOrUpdate(task);
  }

  constructor() {
    this.load();
  }
}
