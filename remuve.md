src/main.ts
  ```
  import { bootstrapApplication } from '@angular/platform-browser';
  import { appConfig } from './app/app.config';
  import { AppComponent } from './app/app.component';

  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
  ```
src/index.html
  ```
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>SystemTask</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <app-root></app-root>
  </body>
  </html>
  ```
src/app/working.service.ts
  ```
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
  ```
src/app/working.service.spec.ts
  ```
  import { TestBed } from '@angular/core/testing';

  import { WorkingService } from './working.service';

  describe('WorkingService', () => {
    let service: WorkingService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(WorkingService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });
  ```
src/app/work.ts
  ```
  import { Status } from "./status";

  export interface Work {
      start: Date,
      stop: Date,
      status: Status
  }
  ```
src/app/task.ts
  ```
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
  }
  ```
src/app/category.ts
  ```
  export interface Category {
      id: number,
      name: string,
      color?: string; // Add color property
  }
  ```
src/app/app.routes.ts
  ```
  import { Routes } from '@angular/router';
  import { MainComponent } from './main/main.component';
  import { AddTaskComponent } from './add-task/add-task.component';
  import { TasksComponent } from './tasks/tasks.component';
  import { AddCategoryComponent } from './add-category/add-category.component';

  export const routes: Routes = [
      { path: "", component: MainComponent },
      { path: "tasks", component: TasksComponent },
      { path: "add", component: AddTaskComponent },
      { path: "add/:id", component: AddTaskComponent},
      { path: "category", component: AddCategoryComponent },
      { path: "category/:id", component: AddCategoryComponent},
  ];
  ```
src/app/app.config.ts
  ```
  import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
  import { provideRouter } from '@angular/router';

  import { routes } from './app.routes';

  export const appConfig: ApplicationConfig = {
    providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
  };
  ```
src/app/app.config.ts
  ```
  import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
  import { provideRouter } from '@angular/router';

  import { routes } from './app.routes';

  export const appConfig: ApplicationConfig = {
    providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
  };
  ```
src/app/app.component.ts
  ```
  import { Component } from '@angular/core';
  import { RouterOutlet } from '@angular/router';
  import { MenuComponent } from './menu/menu.component';

  @Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, MenuComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
  })
  export class AppComponent {
    title = 'systemTask';
  }
  ```
src/app/app.component.spec.ts
  ```
  import { TestBed } from '@angular/core/testing';
  import { AppComponent } from './app.component';

  describe('AppComponent', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent],
      }).compileComponents();
    });

    it('should create the app', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it(`should have the 'systemTask' title`, () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.title).toEqual('systemTask');
    });

    it('should render title', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Hello, systemTask');
    });
  });
  ```
src/app/app.component.html
  ```
  <app-menu></app-menu>
  <div class="container">
      <router-outlet></router-outlet>
  </div>
  ```
src/app/tasks/tasks.component.ts
  ```
  import { Component } from '@angular/core';
  import { WorkingService } from '../working.service';
  import { Router } from '@angular/router';
  import { Task } from '../task';
  import { NgFor } from '@angular/common';
  import { Category } from '../category';
  import { TaskitemComponent } from '../taskitem/taskitem.component';

  @Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [NgFor, TaskitemComponent],
    templateUrl: './tasks.component.html',
    styleUrl: './tasks.component.scss'
  })
  export class TasksComponent {
    public tasks: Task[]= []; 
    public categories: Category[] = [];
    public removeItem:Task = WorkingService.getEmptyTask();
    

    public removeSelect(id: number): void {
      this.removeItem = this.serwis.getTask(id);
    }

    public remove(): void {
      this.serwis.remTask(this.removeItem.id);
      this.removeItem = WorkingService.getEmptyTask();
    }

    constructor(private serwis: WorkingService, private router: Router) {
      serwis.subTask().subscribe((tasks: Task[]) => {
        this.tasks = tasks;
      })

      serwis.subCategory().subscribe((categories: Category[]) => {
        this.categories = categories;
      })
    }
  }
  ```
src/app/tasks/tasks.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { TasksComponent } from './tasks.component';

  describe('TasksComponent', () => {
    let component: TasksComponent;
    let fixture: ComponentFixture<TasksComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TasksComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(TasksComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/tasks/tasks.component.html
  ```


  <div>
    <div class="modal fade" id="removeModal" tabindex="-1" aria-labelledby="removeModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="removeModalLabel">Usuwanie danych</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Czy jesteś pewien, że chcesz usunąć? <br/><br/> {{removeItem.name}}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
            <button type="button" class="btn btn-danger" (click)="remove()" data-bs-dismiss="modal" >Usuń</button>
          </div>
        </div>
      </div>
    </div>

      <app-taskitem *ngFor="let item of tasks" [dane]="item" (delete)="removeSelect($event)">ssss</app-taskitem>
  </div>
  ```
src/app/taskitem/taskitem.component.ts
  ```
  import { Component, EventEmitter, Input, Output } from '@angular/core';
  import { Task } from '../task';
  import { Router } from '@angular/router';
  import { WorkingService } from '../working.service';
  import { NgClass } from '@angular/common';

  @Component({
    selector: 'app-taskitem',
    standalone: true,
    imports: [NgClass],
    templateUrl: './taskitem.component.html',
    styleUrl: './taskitem.component.scss'
  })
  export class TaskitemComponent {
    @Input() dane:Task = WorkingService.getEmptyTask();
    @Output() delete = new EventEmitter<number>();

    public workTime: string = "00:00:00";
    public categories = [WorkingService.getBasicCategory()];

    constructor(private router: Router, private serv: WorkingService){
      this.categories = this.serv.getCategories();
      setInterval(() => {
        this.workTime = WorkingService.getWorkTime(this.dane);
      }, 500);
    }

    public getCategoryName(id: number): string {
      return this.categories.filter(e => e.id == id)[0].name
    }

    public edit(id: number) {
      this.router.navigate(['/add', id]);
    }

    public status(): boolean {
      let status: boolean = false;
      if(this.dane.work.length > 0){
        let lastWork = this.dane.work.at(-1);
        status = lastWork?.status.id == WorkingService.workStatusStart;
      }

      return status;
    }

    public statusChange() {
      this.serv.statusChange(this.dane);
    }

    public removeSelect(id: number){
      this.delete.emit(id);
      console.log(id); // coś tu jest źle, removeID definitywnie nie działa, chyba już nieaktualne
    }
  }
  ```
src/app/taskitem/taskitem.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { TaskitemComponent } from './taskitem.component';

  describe('TaskitemComponent', () => {
    let component: TaskitemComponent;
    let fixture: ComponentFixture<TaskitemComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TaskitemComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(TaskitemComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/taskitem/taskitem.component.html
  ```
  <div class="card mt-3">
    <div class="card-body">
      <div class="row">
        <div class="col-7">
          <h4>{{ dane.name }}</h4>  
        </div>
        <div class="col-1">
          <div class="text-wrap text-bg-info badge">
            {{ getCategoryName(dane.category) }}
          </div>
        </div>
        <div class="col-1">
          <div class="text-wrap text-bg-primary badge">
            {{ workTime }}
          </div>
        </div>
        <div class="col-3">
          <span
            [ngClass]="{
              btn: true,
              'btn-primary': !status(),
              'btn-danger': status(),
              'ms-1': true
            }"
            (click)="statusChange()"
          >
            <i
              [ngClass]="{
                bi: true,
                'bi-play-circle': !status(),
                'bi-pause-circle': status()
              }"
            ></i>
          </span>
          <span class="btn btn-success ms-1" (click)="edit(dane.id)"
            ><i class="bi bi-pen"></i
          ></span>
          <span
            class="btn btn-danger ms-1"
            (click)="removeSelect(dane.id)"
            data-bs-toggle="modal"
            data-bs-target="#removeModal"
            ><i class="bi bi-trash"></i
          ></span>
        </div>
      </div>
    </div>
  </div>
  ```
src/app/menu/menu.component.ts
  ```
  import { Component } from '@angular/core';

  @Component({
    selector: 'app-menu',
    standalone: true,
    imports: [],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
  })
  export class MenuComponent {

  }
  ```
src/app/menu/menu.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { MenuComponent } from './menu.component';

  describe('MenuComponent', () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MenuComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(MenuComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/menu/menu.component.html
  ```
  <nav class="navbar navbar-expand-lg bg-light">
      <div class="container-fluid">
        <a class="navbar-brand" href="/">SystemTask</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#">Start</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/add">Dodaj</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/category">Dodaj kategorie</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/tasks">Task List</a>
            </li>
          </ul>
          <!-- <form class="d-flex" role="search">
            <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
            <button class="btn btn-outline-success" type="submit">Search</button>
          </form> -->
        </div>
      </div>
    </nav>
  ```
src/app/main/main.component.ts
  ```
  import { Component } from '@angular/core';
  import { WorkingService } from '../working.service';

  @Component({
    selector: 'app-main',
    standalone: true,
    imports: [],
    templateUrl: './main.component.html',
    styleUrl: './main.component.scss'
  })
  export class MainComponent {

    constructor(public working: WorkingService) {
      working.subTask().subscribe( tasks => {
        console.log(tasks);
      })
    }

  }
  ```
src/app/main/main.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { MainComponent } from './main.component';

  describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MainComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(MainComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/main/main.component.html
  ```
  <p>main works!</p>
  ```
src/app/add-task/add-task.component.ts
  ```
  import { Component } from '@angular/core';
  import { WorkingService } from '../working.service';
  import { FormsModule } from "@angular/forms";
  import { NgFor } from '@angular/common';
  import { Task } from '../task';
  import { ActivatedRoute, Router } from '@angular/router';
  import moment from 'moment';
  import "moment-business-days"


  @Component({
    selector: 'app-add-task',
    standalone: true,
    imports: [FormsModule, NgFor],
    templateUrl: './add-task.component.html',
    styleUrl: './add-task.component.scss'
  })
  export class AddTaskComponent {
    public dane: Task =  WorkingService.getEmptyTask();
    public status = WorkingService.taskStatus;
    public categories = [WorkingService.getBasicCategory()];
    
    constructor(public serv: WorkingService, private activeRouter: ActivatedRoute, private router: Router) {}
    
    ngOnInit(): void {
      let id = this.activeRouter.snapshot.paramMap.get("id");
      this.dane = this.serv.getTask(id != null ? parseInt(id) : -1);
      this.dane.category = 0;
      this.categories = this.serv.getCategories();
    }

    getTime(date: Date): string {
      const year = date.getFullYear();
      const month = ((date.getMonth() + 1) + "").padStart(2, "0");
      const day = (date.getDate() + "").padStart(2, "0");
      // const hours = (date.getHours() + "").padStart(2, "0");
      // const minutes = (date.getMinutes() + "").padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    public getHours() {
      let start = moment(this.dane.taskStart);
      let end = moment(this.dane.taskEnd);
      end.add(1, 'day');
      return end.businessDiff(start) * 8;
    }

    setTaskStart(th: any): void {
      let taskS = new Date(th.target.value);
      if(taskS <= this.dane.taskEnd)
        this.dane.taskStart = new Date(th.target.value);
    }

    setTaskEnd(th: any): void {
      let taskE = new Date(th.target.value)
      if(taskE >= this.dane.taskStart)
        this.dane.taskEnd = taskE;
    }

    save(){
      this.serv.addOrUpdate(this.dane);
      this.router.navigate(['/tasks']);
    }
  }
  ```
src/app/add-task/add-task.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { AddTaskComponent } from './add-task.component';

  describe('AddTaskComponent', () => {
    let component: AddTaskComponent;
    let fixture: ComponentFixture<AddTaskComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AddTaskComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(AddTaskComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/add-task/add-task.component.html
  ```
  <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Dodaj zadanie</h5>
        <div class="mt-3">
          <label for="name" class="form-label">Nazwa zadania </label>
          <input type="text" class="form-control" id="name" [(ngModel)]="dane.name"  placeholder="Nazwa">
        </div>

        <div class="row">
          <div class="col-6">
            <label for="category" class="form-label">Kategoria</label>
              <select class="form-select" id="category" [(ngModel)]="dane.category">
                <option *ngFor="let item of categories" [ngValue]="item.id" selected>{{item.name}}</option>
              </select> 
          </div>
          <div class="col-6">
            <label for="status" class="form-label">Status</label>
              <select class="form-select" id="status" [(ngModel)]="dane.status">
                <option *ngFor="let item of status" [ngValue]="item.id" >{{item.name}}</option>
              </select>
          </div>
        </div>

        <div class="row">
          <div class="col-6">
              <div class="mt-3">
                  <label for="taskStart" class="form-label">Czas startu zadania</label>
                  <input type="date" class="form-control" id="taskStart" [value]="getTime(dane.taskStart)" (change)="setTaskStart($event)">
              </div>
          </div>
          <div class="col-6">
              <div class="mt-3">
                  <label for="taskEnd" class="form-label">Czas końca zadania</label>
                  <input type="date" class="form-control" id="taskEnd" [value]="getTime(dane.taskEnd)" (change)="setTaskEnd($event)">
              </div>
          </div>
        </div>

        <div class="mt-3">
          <p>Czas realizacji <span>{{getHours()}}</span> godzin(y)</p>
        </div>

        <div class="mt-3">
          <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="taskActive" [(ngModel)]="dane.active">
              <label class="form-check-label" for="taskActive">Aktywność</label>
            </div>
        </div>

        <div class="mt-3 d-flex justify-content-end">
          <button type="button" class="btn btn-primary" (click)="save()">Zapisz</button>
        </div>
      </div>
    </div>
  ```
src/app/add-category/add-category.component.ts
  ```
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Category } from '../category';
import { WorkingService } from '../working.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [FormsModule, CommonModule], // Add CommonModule here
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'] // Corrected to styleUrls
})
export class AddCategoryComponent {
  public dane: Category = WorkingService.getEmptyCategory();
  public categories: Category[] = [];

  constructor(
    public serv: WorkingService,
    private activeRouter: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.activeRouter.snapshot.paramMap.get('id');
    this.dane = this.serv.getCategory(id ? parseInt(id) : -1);    
    this.categories = this.serv.getCategories();
  }

  save() {
    this.serv.addOrUpdateCategory(this.dane);
    alert('Zapisano');
  }

  public remove(id: number): void {
    this.serv.remCategory(id);
    this.categories = this.serv.getCategories();
  }
}
  ```
src/app/add-category/add-category.component.spec.ts
  ```
  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { AddCategoryComponent } from './add-category.component';

  describe('AddCategoryComponent', () => {
    let component: AddCategoryComponent;
    let fixture: ComponentFixture<AddCategoryComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AddCategoryComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(AddCategoryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
  ```
src/app/add-category/add-category.component.html
  ```
  <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Dodaj kategorię</h5>
        <div class="mt-3">
          <label for="name" class="form-label">Nazwa Kategoria </label>
          <input type="text" class="form-control" id="name" [(ngModel)]="dane.name" placeholder="Kategoria">
        </div>

        <div class="mt-3">
          <h5>Lista Kategorii</h5>
          <ul class="list-group">
            <li class="list-group-item" *ngFor="let category of categories">
              {{ category.name }}
              <button class="btn btn-danger btn-sm float-end" (click)="remove(category.id)">Usuń</button>
            </li>
          </ul>
        </div>

        <div class="mt-3 d-flex justify-content-end">
          <button type="button" class="btn btn-primary" (click)="save()">Zapisz</button>
        </div>
      </div>
    </div>
  ```

