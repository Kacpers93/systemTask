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
  public colors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  
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
