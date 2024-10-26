import { Injectable } from '@angular/core';
import { Status } from './status';
import { Task } from './task';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkingService {
  static lastID: number = 0; 
  
  public static taskStatus: Status[] = [
    { id: 0, name: "Do wykonania" },
    { id: 250, name: "W trakcie" },
    { id: 500, name: "Wykonane" },
  ]
  
  public static workStatus: Status[] = [
    { id: 250, name: "Do trakcie" },
    { id: 500, name: "Wykonane" },
  ]
  
  private tasks: Task[] = [];
  
  private rxdata: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>(this.tasks);
  
  public sub(): Observable<Task[]>{
    return this.rxdata.asObservable();
  }

  public refresh():void {
    this.rxdata.next(this.tasks);
  }

  public addOrUpdate(task: Task) {
    if(task.id < 0 ) {
      this.tasks.push(task);
      task.id = ++ WorkingService.lastID;
    } else {
      let ind = this.tasks.findIndex(e=>e.id = task.id);
      if (ind >= 0) {
        this.tasks[ind] = task;
      }
    }
    this.tasks.push(task);
    this.save();
    this.refresh();
  }

  save(): void {
    localStorage.setItem("sem3_apl_int", JSON.stringify(this.tasks));
  }

  load(): void {
    let dane = localStorage.getItem("sem3_apl_int");
    if(!dane)
      dane = '[]';
    this.tasks = JSON.parse(dane) as Task[];
    this.tasks.forEach((e)=>{
      e.taskStart = new Date(e.taskStart);
      e.taskEnd = new Date(e.taskEnd);
    })

    WorkingService.lastID = Math.max( ...this.tasks.map(e =>e.id) )

    console.log(this.tasks);
    this.refresh();
  }

  constructor() { 
    this.load();
  }
}
