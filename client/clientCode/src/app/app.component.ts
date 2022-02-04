import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clientCode';
  servicesData = [];
  constructor(private http: HttpClient) { }

  ngOnInit() {      
      // Simple GET request with response type <any>
      this.http.get<any>('http://localhost:3000/services').subscribe(data => {
          console.log('Hi')
          this.servicesData = data;
      })
  }



}

