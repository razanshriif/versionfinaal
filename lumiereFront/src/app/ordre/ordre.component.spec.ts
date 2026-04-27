import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdreComponent } from './ordre.component';

describe('OrdreComponent', () => {
  let component: OrdreComponent;
  let fixture: ComponentFixture<OrdreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



