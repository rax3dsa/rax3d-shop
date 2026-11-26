import numpy as np,zipfile
def meshxml(v,f):
    return '<mesh><vertices>'+''.join(f'<vertex x="{x:.5f}" y="{y:.5f}" z="{z:.5f}"/>' for x,y,z in v)+'</vertices><triangles>'+''.join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a,b,c in f)+'</triangles></mesh>'
mv,mf,sv,sf,ev,ef=[np.load(n) for n in ('mp_v.npy','mp_f.npy','ms_v.npy','ms_f.npy','me_v.npy','me_f.npy')]
model=f'''<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
 <metadata name="Application">BambuStudio-02.09.01.70</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <metadata name="Title">RAX3D Saudi Red Line design 5 (white Saudi emblem, rounded strip ends)</metadata>
 <resources>
  <object id="1" type="model">{meshxml(mv,mf)}</object>
  <object id="2" type="model">{meshxml(sv,sf)}</object>
  <object id="3" type="model">{meshxml(ev,ef)}</object>
  <object id="4" type="model"><components><component objectid="1"/><component objectid="2"/><component objectid="3"/></components></object>
 </resources>
 <build><item objectid="4" transform="1 0 0 0 1 0 0 0 1 128 128 0" printable="1"/></build>
</model>'''
cfg='''<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="4">
    <metadata key="name" value="Design5_Saudi_Map_Emblem_RedStrip"/>
    <metadata key="extruder" value="1"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="Map_Green"/>
      <metadata key="extruder" value="1"/>
    </part>
    <part id="2" subtype="normal_part">
      <metadata key="name" value="Strip_Red"/>
      <metadata key="extruder" value="2"/>
    </part>
    <part id="3" subtype="normal_part">
      <metadata key="name" value="Emblem_White"/>
      <metadata key="extruder" value="3"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <model_instance>
      <metadata key="object_id" value="4"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
  </plate>
</config>'''
ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="text/xml"/></Types>'
rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'
with zipfile.ZipFile('design5.3mf','w',zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml',ct);z.writestr('_rels/.rels',rels);z.writestr('3D/3dmodel.model',model);z.writestr('Metadata/model_settings.config',cfg)
print('ok')
