import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('created a form with username and password input and login button', () => {
    // const fixture = TestBed.createComponent(LoginComponent);
    const fullnameContainer = fixture.debugElement.nativeElement.querySelector('.fullname-container');
    const usernameContainer = fixture.debugElement.nativeElement.querySelector('.username-container');
    const emailContainer = fixture.debugElement.nativeElement.querySelector('.email-container');
    const genderContainer = fixture.debugElement.nativeElement.querySelector('.gender-container');
    const confirmPassContainer = fixture.debugElement.nativeElement.querySelector('.confirm-pass-container');
    const passwordContainer = fixture.debugElement.nativeElement.querySelector('.password-container');
    const registerBtnContainer = fixture.debugElement.nativeElement.querySelector('.nvmlogin-btn-container');
    expect(usernameContainer).toBeDefined();
    expect(fullnameContainer).toBeDefined();
    expect(emailContainer).toBeDefined();
    expect(genderContainer).toBeDefined();
    expect(confirmPassContainer).toBeDefined();
    expect(passwordContainer).toBeDefined();
    expect(registerBtnContainer).toBeDefined();
  });
});
