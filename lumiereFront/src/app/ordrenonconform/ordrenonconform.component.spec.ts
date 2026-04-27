import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdrenonconformComponent } from './ordrenonconform.component';

describe('OrdrenonconformComponent', () => {
  let component: OrdrenonconformComponent;
  let fixture: ComponentFixture<OrdrenonconformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdrenonconformComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdrenonconformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



