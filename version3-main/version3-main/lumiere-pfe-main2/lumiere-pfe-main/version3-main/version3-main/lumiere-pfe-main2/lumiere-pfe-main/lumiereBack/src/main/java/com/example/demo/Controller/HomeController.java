package com.example.demo.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {

    @RequestMapping(value = { "/", "/{path:^(?!api$|client$|ordres$|clients$)[^\\.]+$}",
            "/**/{path:^(?!api$|client$|ordres$|clients$)[^\\.]+$}" })
    public String forward() {
        return "forward:/index.html";
    }
}
