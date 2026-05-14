import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdredetailComponent } from './ordredetail.component';

describe('OrdredetailComponent', () => {
  let component: OrdredetailComponent;
  let fixture: ComponentFixture<OrdredetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdredetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdredetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



