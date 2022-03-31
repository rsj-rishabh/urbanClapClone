import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { ServicesComponent } from './components/services/services.component';
import { LandingComponent } from './components/landing/landing.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login/login.component';
import { BookingsComponent } from './components/bookings/bookings.component';
import { ServiceBookingComponent } from './components/service-booking/service-booking.component';
import { LogoutComponent } from './components/logout/logout.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';

const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'home',
    component: LandingComponent
  },
  { 
    path: '',
    redirectTo: '/home', 
    pathMatch: 'full' 
  },
  {
    path: 'services',
    component: ServicesComponent
  },
  {
    path: 'bookings',
    component: BookingsComponent
  },
  {
    path: 'bookService',
    component: ServiceBookingComponent
  },
  { 
    path: 'logout',
    component: LogoutComponent 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), HttpClientModule],
  exports: [RouterModule, HttpClientModule]
})

export class AppRoutingModule { }
