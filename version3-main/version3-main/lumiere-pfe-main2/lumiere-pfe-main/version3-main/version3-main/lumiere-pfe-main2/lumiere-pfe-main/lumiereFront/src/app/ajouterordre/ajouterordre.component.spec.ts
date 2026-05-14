import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterordreComponent } from './ajouterordre.component';

describe('AjouterordreComponent', () => {
  let component: AjouterordreComponent;
  let fixture: ComponentFixture<AjouterordreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AjouterordreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AjouterordreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



