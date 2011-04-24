/**
 * Javascript Particle Emitter
 * Written By Jason Harwig
 * http://nearinfinity.com/blogs/page/jharwig
 * 
 * This work is licensed under a Creative Commons Attribution 2.5 License
 * More Info: http://creativecommons.org/licenses/by/2.5/
 * 
 */
(function() {
  var Color = Class.create({
    initialize: function(hsv) {
      this.hsv = hsv;
    },
    changeHue: function(h) {
      this.hsv = [h, this.hsv[1], this.hsv[2]];
    },
    toRGB: function() {
        var hsv = this.hsv,
            h = hsv[0] / 360,
            s = hsv[1] / 100,
            v = hsv[2] / 100,
            rgb = [];

        if (s == 0) {
            rgb[0] = v * 255;
            rgb[1] = v * 255;
            rgb[2] = v * 255;
        } else {
            var var_h = h * 6,
                var_i = Math.floor(var_h),
                var_1 = v * (1 - s),
                var_2 = v * (1 - s * (var_h - var_i)),
                var_3 = v * (1 - s * (1 - (var_h - var_i)));

            if (var_i == 0) {var_r = v; var_g = var_3; var_b = var_1;}
            else if (var_i == 1) {var_r = var_2; var_g = v; var_b = var_1;}
            else if (var_i == 2) {var_r = var_1; var_g = v; var_b = var_3;}
            else if (var_i == 3) {var_r = var_1; var_g = var_2; var_b = v;}
            else if (var_i == 4) {var_r = var_3; var_g = var_1; var_b = v;}
            else {var_r = v; var_g = var_1; var_b = var_2;};

            rgb[0] = var_r * 255;
            rgb[1] = var_g * 255;
            rgb[2] = var_b * 255;
        }
      return [Math.floor(rgb[0]), Math.floor(rgb[1]), Math.floor(rgb[2])];
    }
  });
  var DT = 0.05;
  
  window.Particle = Class.create({
      initialize: function(x, y, engine) {
          this.initPos = [x, y];
          this.pos = [x, y];
          this.calc_random = engine.calc_random;
          this.vel = [this.calc_random(engine.vel_range[0], engine.vel_range[1]),
                      this.calc_random(engine.vel_range[0], engine.vel_range[1])];
          this.opacity = 0;
          this.alive = true;
          this.life_dec = this.calc_random(engine.life_range[0], engine.life_range[1]);
          this.engine = engine;
          this.respawn = engine.respawn;
          this.curr_respawn = engine.respawn;    
          this.previousPositions = [];
      },

      circle: function(g, x, y, r) {
        g.beginPath();

        var grad = g.createRadialGradient(x, y, 1, x, y, r);
        grad.addColorStop(0, 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ',' + this.opacity + ')');
        grad.addColorStop(1, 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ',0)');      
        g.fillStyle = grad;
        g.arc(x, y, r, 0, Math.PI/180*360, false);
        g.fill();     

        this.previousPositions.push({x:x-r, y:y-r, w:r*2, h:r*2});
      },

      draw: function(g, velocity_callback) {

          if (this.opacity < 0) {
              this.reset(false);
          } else {
              if (this.opacity > 1.0) {
                  this.opacity = 1;
                  this.opacity_delta *= -1/5;
              }

              this.circle(g, this.pos[0], this.pos[1], this.black ? 5 : 10);

              this.vel = velocity_callback(this.vel);
              this.pos[0] += this.vel[0] * DT;
              this.pos[1] += this.vel[1] * DT;
              this.opacity += this.opacity_delta;
          }
      },

      dirtyRect: function() {
          var pos = this.previousPositions;

          return pos.length > 0 ? pos.shift() : undefined; 
      },

      reset: function(shouldBeAlive) {
          this.alive = shouldBeAlive;
          this.opacity = 1.0;
          this.opacity_delta = this.life_dec*5;
          this.pos[0] = this.initPos[0];
          this.pos[1] = this.initPos[1];        
          if (Math.random() > 0.9) {
            this.black = true;
            this.color = new Color([0, 0, this.calc_random(0, 50)]).toRGB();      
            this.opacity = 0.5;  
          } else {
            this.black = false;
            this.color = new Color([this.calc_random(0, 60), 100, 100]).toRGB();        
          }
          this.vel = [this.calc_random(this.engine.vel_range[0], this.engine.vel_range[1]),
                      this.calc_random(this.engine.vel_range[0], this.engine.vel_range[1])];
          this.life_dec = this.calc_random(this.engine.life_range[0], this.engine.life_range[1]);        
      }
  });


  window.Emitter = Class.create({
    initialize: function(options, style) {
      this.options = options;
      this.canvas = $("particle_canvas");
      this.particles = [];
      this.max_particles = this.options.max_particles || 10;
      this.vel_range = [(this.options.vel && this.options.vel[0]) || -1, (this.options.vel && this.options.vel[1]) || 1];
      this.life_range = [(this.options.life && this.options.life[0]) || .01, (this.options.life && this.options.life[1]) || .02];
      this.event_type = this.options.event_type || 'click';
      this.x_force = this.options.x_force || 0;
      this.y_force = this.options.y_force || 0;
      this.size = this.options.size;
      this.respawn = this.options.respawn || 1;
      this.prepareParticles();
    },

    calc_random: function(min, max) {
        var rnd = (max - min) * Math.random() + min;
        return rnd;
    },

    prepareParticles: function() {
        var inst = this,
          halfInputW = this.canvas.width/2 * 0.6,
          x1 = +this.canvas.width / 2 - halfInputW,
          x2 = +this.canvas.width / 2 + halfInputW,
          y = +this.canvas.height;

        this.max_particles.times(function(value, index) {
          var x = inst.calc_random(x1, x2);
          inst.particles.push(new Particle(x, y, inst));
        });
    },

    start: function() {
      this.particles.each(function(particle) {
          particle.reset(true);
      });

      var inst = this,
        FPS = Math.floor(1000/60), 
        startTime = new Date().getTime(),
        lastTime = startTime,
        tmr = setInterval(function() {
            var now = new Date().getTime(),
              elapsedTime = now - startTime,
              expired = elapsedTime > 10000,
              dt = now - lastTime / FPS;

            lastTime = now;
            if (!inst.update(dt, expired)) {
              clearInterval(tmr);
            }
          }, FPS); 
      Titanium.App.fireEvent("started", {});
    },

    update: function(dt, expired) {
      var inst = this, g = this.canvas.getContext('2d');

      //g.clearRect(0,0,150,150);
      this.particles.each(function(particle) {
        var rect = particle.dirtyRect();

        if (rect) {
          g.clearRect(rect.x, rect.y, rect.w, rect.h);        
        }
      });

      this.particles.each(function(particle) {
          if (particle.alive) {
              particle.draw(g, function(vel) {
                  vel[0] += inst.x_force;
                  vel[1] += inst.y_force;
                  return vel;
              });                
          }
      });
      var anyAlive = this.particles.inject(false, function(anyAlive, particle) {
         if (!particle.alive && --particle.curr_respawn > 0 && !expired) {
             particle.reset(true);
         }
         return anyAlive || particle.alive; 
      });

      if (anyAlive) {
          return true;
      } else {
        this.particles.each(function(p) {
          p.curr_respawn = p.respawn;
        });
        Titanium.App.fireEvent("finished", {});
        return false;
      }
    }
  });  
})();