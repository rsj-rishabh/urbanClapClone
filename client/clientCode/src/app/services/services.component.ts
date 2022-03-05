import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {

  servicesData = [];
  constructor(private http: HttpClient) { }

  ngOnInit() {      
    // Simple GET request with response type <any>
    this.http.get<any>('http://localhost:3000/api/services').subscribe(data => {
        console.log('Hi')
        this.servicesData = data;
    })
}

}




