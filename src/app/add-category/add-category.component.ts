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